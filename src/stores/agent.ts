import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { auth, API_BASE_URL } from '../firebaseConfig'
import { onAuthStateChanged, signOut, signInWithCustomToken, type User as FirebaseUser } from 'firebase/auth'

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
     * @param liffIdToken - 從 liff.getIDToken() 取得的 JWT
     */
    async function loginWithLiff(liffIdToken: string) {
        try {
            // 這個後端端點 `/auth/liff` 需要您在後端實作。
            // 它的職責是：
            // 1. 接收前端傳來的 LIFF ID Token。
            // 2. 驗證此 Token 的合法性 (通常是與 LINE 的 API 驗證)。
            // 3. 根據 Token 中的 LINE User ID，在您的資料庫中尋找或建立對應的顧問帳號。
            // 4. 使用 Firebase Admin SDK 為該帳號產生一個 Custom Token。
            // 5. 將 Firebase Custom Token 回傳給前端。
            const response = await fetch(`${API_BASE_URL}auth/liff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: liffIdToken }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'LIFF 登入驗證失敗' }));
                throw new Error(errorData.message || '後端驗證失敗');
            }

            const { firebaseToken } = await response.json();
            await signInWithCustomToken(auth, firebaseToken);
            // 登入成功後，onAuthStateChanged 會自動觸發，更新 agent 狀態。
        } catch (error) {
            console.error('LIFF Login failed:', error);
            throw error; // 將錯誤向上拋出，讓 LineBrowserGuard 可以捕捉到並顯示備用畫面。
        }
    }

    return { agent, isInitialized, isLoggedIn, init, logout, loginWithLiff }
})