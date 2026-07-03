import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { auth, API_BASE_URL } from '../firebaseConfig'
import { onAuthStateChanged, signOut, signInWithCustomToken, type User as FirebaseUser, OAuthProvider, linkWithCredential } from 'firebase/auth'

// 用於解碼 LINE ID Token
import { jwtDecode } from 'jwt-decode';
import { ElMessage } from 'element-plus';

// 為了程式碼清晰，定義 Agent (顧問) 物件的型別
export interface Agent {
    uid: string;
    username: string;
    email: string | null;
    avatarUrl: string;
}

export const useAgentStore = defineStore('agent', () => {
    // --- State ---
    const agent = ref<Agent | null>(null)
    // 這個旗標用來追蹤 Firebase 的初始驗證狀態是否已確認
    const isInitialized = ref(false)

    // --- Getters ---
    const isLoggedIn = computed(() => !!agent.value)

    // --- Actions ---
    let unsubscribe: (() => void) | null = null;

    /**
     * 初始化 Firebase 驗證狀態監聽器。
     * 這個動作應該在應用程式啟動時被呼叫一次。
     */
    function init() {
        if (unsubscribe) return; // 防止重複初始化

        unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // 顧問已登入
                agent.value = {
                    uid: firebaseUser.uid,
                    username: firebaseUser.displayName || firebaseUser.email || '顧問',
                    email: firebaseUser.email,
                    avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/8.x/adventurer/svg?seed=${firebaseUser.uid}`
                }
            } else {
                // 顧問已登出
                agent.value = null
            }

            // 在第一次狀態確認後，將 isInitialized 設為 true
            if (!isInitialized.value) {
                isInitialized.value = true;
            }

            console.log('Firebase 驗證狀態已更新')
        });
    }

    async function logout() {
        await signOut(auth);
    }

    /**
     * 使用 LIFF ID Token 向後端換取 Firebase Custom Token 並登入
     * @param liffIdToken - 從 liff.getIDToken() 取得的 JWT 字串
     */
    async function loginWithLiff(liffIdToken: string) {
        try {
            // 這個後端端點 `/auth/line` 需要您在後端實作。
            // 它的職責是：
            // 1. 接收前端傳來的原始 LIFF ID Token。
            // 2. 在後端驗證此 Token 的合法性 (與 LINE 的 API 驗證)。
            // 3. 根據 Token 中的 LINE User ID，在您的資料庫中尋找或建立對應的顧問帳號。
            // 4. 使用 Firebase Admin SDK 為該帳號產生一個 Firebase Custom Token。
            // 5. 將 Custom Token 回傳給前端。
            const response = await fetch(`${API_BASE_URL}api/v1/auth/line`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken: liffIdToken }),
            });

            if (!response.ok) {
                // 增強錯誤處理，以便在開發者工具中看到更詳細的後端訊息
                let backendError;
                try {
                    backendError = await response.json();
                } catch {
                    // 如果後端回傳的不是 JSON，或解析失敗，則取得原始文字
                    backendError = { message: await response.text() };
                }
                throw new Error(`後端驗證失敗: ${backendError.message || '未提供詳細錯誤訊息。'}`);
            }

            const { customToken } = await response.json();

            // --- 除錯輔助 ---
            // 在呼叫 signInWithCustomToken 之前，將從後端收到的 Custom Token 印出來。
            // 這有助於確認後端是否回傳了正確的、非空的 Token 字串。
            // 您可以將這個 Token 貼到 jwt.io 網站上來解碼，檢查其內容是否符合 Firebase 的要求。
            console.log('Received Firebase Custom Token from backend:', customToken);
            if (!customToken) {
              throw new Error('從後端收到的 Firebase Custom Token 是空的，請檢查後端 API 的回傳值。');
            }
            // --- 除錯結束 ---

            await signInWithCustomToken(auth, customToken);
            // 登入成功後，onAuthStateChanged 會自動觸發，更新 agent 狀態。
        } catch (error) {
            console.error('LIFF Login failed:', error);
            throw error; // 將錯誤向上拋出，讓 LineBrowserGuard 可以捕捉到並顯示備用畫面。
        }
    }

    /**
     * 將 LINE 帳號連結到當前已登入的 Firebase 使用者。
     * 此函式應在使用者已透過其他方式（如 Email/密碼）登入後，於「帳號設定」頁面中呼叫。
     * @param lineIdToken - 從前端 LIFF SDK 取得的 LINE ID Token 字串。
     */
    async function linkLineAccount(lineIdToken: string) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('使用者未登入，無法執行帳號連結操作。');
        }

        try {
            // 步驟 1: 建立一個 LINE 的 OAuth credential。
            // 'line.me' 是您在 Firebase 控制台中為 LINE 設定的提供商 ID，請確保它與您的設定一致。
            const credential = new OAuthProvider('line.me').credential({
                idToken: lineIdToken,
            });

            // 步驟 2: 呼叫 Firebase 的 linkWithCredential，將 LINE 身份連結到當前的 Firebase 使用者。
            // 這會在 Firebase Authentication 層級完成帳號的合併。
            await linkWithCredential(currentUser, credential);
            console.log('Firebase account successfully linked with LINE identity.');

            // 步驟 3: 在 Firebase 連結成功後，立即通知我們的後端，以便同步資料庫狀態。
            // 解碼 LINE ID Token 以取得 payload，並傳送給後端。
            const linePayload = jwtDecode(lineIdToken);

            const response = await fetch(`${API_BASE_URL}api/v1/agents/me/bind-line`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 附上當前使用者的 Firebase ID Token，以便後端進行身份驗證。
                    'Authorization': `Bearer ${await currentUser.getIdToken()}`
                },
                body: JSON.stringify(linePayload),
            });

            if (!response.ok) {
                const backendError = await response.json();
                // 注意：此時 Firebase 層已經連結成功。如果後端綁定失敗，
                // 理想情況下可能需要一個補償機制（例如 un-link），但這會增加複雜性。
                // 目前我們先拋出明確的錯誤，讓上層 UI 知道後端同步失敗。
                throw new Error(`後端 LINE 帳號綁定失敗: ${backendError.message || '未知錯誤'}`);
            }

            console.log('Backend database successfully updated for LINE account binding.');
            ElMessage.success('您的 LINE 帳號已成功連結！');

        } catch (error: any) {
            console.error('Failed to link LINE account:', error);
            // 處理一個常見的 Firebase 錯誤：此 LINE 帳號已被另一個使用者綁定。
            if (error.code === 'auth/credential-already-in-use') {
                throw new Error('此 LINE 帳號已被另一個使用者帳號綁定，無法重複連結。');
            }
            throw error; // 將其他錯誤向上拋出，讓呼叫者可以捕捉並顯示 UI 提示。
        }
    }

    return { agent, isInitialized, isLoggedIn, init, logout, loginWithLiff, linkLineAccount }
})