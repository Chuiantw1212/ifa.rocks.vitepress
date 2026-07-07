<template>
    <!-- 等待驗證狀態初始化完成後再渲染，避免閃爍 -->
    <el-space class="login" :size="20" alignment="center" direction="horizontal">
        <!-- 登入後顯示使用者頭像與下拉選單 -->
        <el-dropdown v-if="isLoggedIn" trigger="click" @command="handleCommand">
            <el-avatar :size="32" :src="agent.avatarUrl" :alt="agent.username" aria-label="使用者選單" />
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item command="account">帳號管理</el-dropdown-item>
                    <el-dropdown-item command="logout" divided>登出系統</el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <!-- 未登入時顯示可點擊的登入頭像 -->
        <el-avatar v-else :size="32" :icon="UserFilled" @click="handleLoginClick()" aria-label="登入或註冊" />
    </el-space>

    <el-dialog v-model="loginDialogVisible" title="理財規劃系統登入" width="400px" align-center :append-to-body="true" :destroy-on-close="true">
        <!-- FirebaseUI 將會在這個容器中渲染 -->
        <div id="firebaseui-auth-container"></div>
    </el-dialog>
</template>

<script setup lang="ts">
import { watch, nextTick, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vitepress';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { auth } from '@/firebaseConfig'
import liff from '@line/liff';
import { GoogleAuthProvider, EmailAuthProvider, signInWithCustomToken, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { isDesktop, isProblematicWebView } from '@/composables/useWebView';
import { useAgentStore } from '@/stores/agent';

// Vite 環境變數，用於判斷是否為開發模式
const isDev = import.meta.env.DEV;
// 使用者強調：此 LIFF ID 為固定值，請勿改回環境變數。
const LIFF_ID = '2009612107-QeSJSRV2';

// 宣告全域變數，讓 TypeScript 認得從 CDN 載入的 firebaseui
declare global {
    interface Window {
        firebaseui: any;
        liff: any;
    }
}

const agentStore = useAgentStore()
const { loginDialogVisible } = storeToRefs(agentStore);

// 使用 computed 屬性來響應 store 的變化
const isLoggedIn = computed(() => agentStore.isLoggedIn)
const agent = computed(() => agentStore.agent || { username: '', avatarUrl: '' })

const handleLoginClick = () => {
    // 無論環境如何，都觸發登入流程。
    // LineBrowserGuard 將會判斷應該使用 LINE 登入還是標準登入。
    window.dispatchEvent(new CustomEvent('start-line-login'));
};

const router = useRouter();

// 監聽來自 store 的登入成功狀態，以關閉對話框
watch(() => agentStore.isLoggedIn, (loggedIn, wasLoggedIn) => {
    if (loggedIn && !wasLoggedIn && loginDialogVisible.value) {
        agentStore.closeLoginDialog();
        // 增加保護，確保 agent 物件存在
        if (agentStore.agent) {
            ElMessage.success(`歡迎回來，${agentStore.agent.username}`)
        }
    }
})

// 監看 loginDialogVisible 的變化，當它被打開時，啟動 FirebaseUI
watch(loginDialogVisible, (newValue) => {
    // 新增的保護機制：如果使用者已經登入，但登入視窗卻被打開，則立即將其關閉。
    // 這可以處理自動登入成功後，因某些原因誤開登入視窗的情況。
    if (newValue && isLoggedIn.value) {
        console.log('[LoginModule] User is already logged in. Closing login dialog automatically.');
        agentStore.closeLoginDialog();
        return; // 中斷後續的 FirebaseUI 渲染
    }

    if (newValue) { // 當對話框打開時
        const launchFirebaseUI = () => {
            // 使用 nextTick 確保 #firebaseui-auth-container 已被渲染到 DOM 中
            nextTick(() => {
                // 取得或建立 FirebaseUI 實例
                const ui = window.firebaseui.auth.AuthUI.getInstance() || new window.firebaseui.auth.AuthUI(auth);
                const uiConfig = {
                    // credentialHelper: 'local' 在某些瀏覽器（特別是 Safari 或啟用嚴格追蹤保護的 Chrome/Firefox）
                    // 中會因為 iframe 跨域通訊問題導致 popup 登入流程失敗（轉圈後無反應）。
                    // 設置為 NONE 可以停用此機制，改用更直接的方式傳遞結果，解決這個問題。
                    credentialHelper: window.firebaseui.auth.CredentialHelper.NONE,
                    callbacks: {
                        signInSuccessWithAuthResult: async (authResult: any, redirectUrl?: string) => {
                            // 此回呼是整合的核心。
                            // 當使用者透過提供商（Google、電子郵件等）成功登入後觸發。
                            try {
                                // 1. 從成功的身份驗證中取得 ID Token。
                                const idToken = await authResult.user.getIdToken();

                                // 2. 將此 ID Token 發送到我們的後端。
                                // 後端將驗證它，在我們的資料庫中尋找或建立使用者，
                                // 並為我們的 Firebase 專案返回一個自訂 token。
                                const apiUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/auth/firebase`;
                                const response = await fetch(apiUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ idToken: idToken }),
                                });

                                // 將 response body 只讀取一次，並處理非 JSON 的錯誤回應
                                const responseData = await response.json().catch(() => null);

                                if (!response.ok) {
                                    // 在拋出錯誤前，從臨時會話中登出
                                    await auth.signOut();
                                    throw new Error(responseData?.message || '與後端系統同步時發生錯誤');
                                }

                                // 根據後端 API 的回傳格式，從 'customToken' 欄位取得 custom token
                                const customToken = responseData?.customToken;

                                // 3. 使用我們後端提供的自訂 token 登入 Firebase。
                                // 如果 customToken 為空，signInWithCustomToken 會拋出 'auth/missing-custom-token' 錯誤
                                // 這完成了身份驗證循環。agent store 中的 onAuthStateChanged 監聽器
                                // 現在將會捕捉到正確的、經過後端驗證的使用者狀態。
                                await signInWithCustomToken(auth, customToken);

                                // 我們返回 false 來告訴 FirebaseUI 我們已經自己處理了登入流程，
                                // 並防止任何重新導向。
                                return false;

                            } catch (error) {
                                console.error('Custom authentication flow failed:', error);
                                ElMessage.error((error as Error).message || '登入過程中發生未知錯誤');
                                // 如果任何步驟失敗，確保使用者已登出
                                await auth.signOut();
                                return false;
                            }
                        },
                        signInFailure: (error: any) => {
                            console.error('FirebaseUI sign-in error:', error);
                            if (error.code !== 'firebaseui/anonymous-upgrade-merge-conflict') {
                                ElMessage.error('登入失敗，請檢查您的憑證或稍後再試。');
                            }
                        },
                    },
                    signInFlow: 'popup', // 永遠不要變更為 'redirect'，因為我們希望在單頁應用中保持狀態。
                    signInOptions: [
                        GoogleAuthProvider.PROVIDER_ID,
                        {
                            provider: EmailAuthProvider.PROVIDER_ID,
                            signInMethod: 'password',
                            requireDisplayName: false 
                        },
                    ],
                };
                // 在指定的容器中啟動 FirebaseUI
                ui.start('#firebaseui-auth-container', uiConfig);
            });
        };

        // 檢查 UI 腳本是否已載入
        if (window.firebaseui) {
            launchFirebaseUI();
        } else {
            // --- 動態載入 FirebaseUI 的 JS ---
            // CSS 已改由 .vitepress/config.ts 統一預載入
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/ui/6.1.0/firebase-ui-auth__zh_tw.js';
            script.async = true;
            script.onload = launchFirebaseUI; // 載入成功後，啟動 UI
            script.onerror = () => {
                console.error('Failed to load firebase-ui-auth script from CDN.');
                ElMessage.error('登入模組腳本載入失敗');
            };
            document.head.appendChild(script);
        }
    }
});

onMounted(() => {
  // Firebase 的儲存模式設定已移至 agent.ts 的 init() 函式中，以確保在應用程式最早的階段就完成設定。
  // 監聽來自 LineBrowserGuard 的事件，以在非 LIFF 環境中開啟標準登入對話框。
  window.addEventListener('open-firebase-login', agentStore.openLoginDialog);
});

onUnmounted(() => {
  window.removeEventListener('open-firebase-login', agentStore.openLoginDialog);
});

const handleLogout = async () => {
    try {
        // 直接呼叫 Firebase 的 signOut 方法，這是最可靠的登出方式。
        // 它會清除使用者的登入狀態，包括任何持久化的 session。
        // agentStore 應該會透過 onAuthStateChanged 監聽器自動更新其狀態。
        await signOut(auth);
        console.log('[LoginModule] Firebase sign-out successful.');

        // 為了確保「乾淨登出」，我們需要根據不同環境，決定是否要執行 LIFF 登出。
        if (isDesktop()) {
            console.log('[LoginModule] Desktop environment, skipping LIFF logout.');
        } else {
            // 在行動裝置上，我們需要嘗試初始化 LIFF，以判斷環境並清除可能存在的 LIFF session。
            console.log('[LoginModule] Mobile environment detected. Attempting to initialize LIFF for logout...');
            try {
                await liff.init({ liffId: LIFF_ID });
                
                // 使用共享的 composable 來判斷環境，確保邏輯一致。
                // liff.isInClient() 會在 isProblematicWebView 內部被檢查。
                if (liff.isInClient() || isProblematicWebView()) {
                    console.log(`[LoginModule] In ${liff.isInClient() ? 'LIFF Client' : 'WebView'}. Proceeding with LIFF logout.`);
                    if (liff.isLoggedIn()) {
                        liff.logout();
                        console.log('[LoginModule] LIFF logout successful.');
                    }
                } else {
                    console.log('[LoginModule] Standard mobile browser. No LIFF logout necessary.');
                }
            } catch (liffError) {
                console.warn('[LoginModule] LIFF SDK could not be initialized. This is normal for standard mobile browsers.');
            }
        }

        ElMessage.info('您已成功登出');

        // 登出後自動跳轉至儀表板
        await router.go('/pro/dashboard');
    } catch (error) {
        console.error('[LoginModule] Logout Error:', error)
        ElMessage.error('登出時發生錯誤')
    }
};

const handleCommand = (command: string) => {
    switch (command) {
        case 'account':
            router.go('/pro/account');
            break;
        case 'logout':
            handleLogout();
            break;
    }
}
</script>
<style lang="scss" scoped>
.login {
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-left: 16px;
}
</style>