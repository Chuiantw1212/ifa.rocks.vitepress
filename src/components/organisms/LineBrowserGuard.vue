<template>
  <div v-if="showOverlay" class="line-guard-overlay">
    <el-card class="line-guard-card" shadow="always" style="text-align: center;">
      <div
        v-loading="status === 'initializing' || status === 'logging-in'"
        :element-loading-text="loadingText"
        style="min-height: 280px; display: flex; justify-content: center; align-items: center;"
      >
        <el-result v-if="status === 'error'" icon="warning" :title="isDev ? 'LIFF 登入失敗' : '請使用預設瀏覽器開啟'">
          <template #sub-title>
            <p>{{ errorMessage }}</p>
          </template>
          <template #extra>
            <div>
              <el-alert
                v-if="!isDev"
                title="為了獲得最佳體驗，請點擊角落的「...」選單，然後選擇「使用預設瀏覽器開啟」。"
                type="info"
                :closable="false"
                center
                style="margin-bottom: 20px;"
              />
            </div>
            <el-alert
              v-if="isDev"
              title="請檢查瀏覽器開發者工具 (Console) 的錯誤訊息以進行除錯。"
              type="error"
              :closable="false"
            />
          </template>
        </el-result>
        <el-result v-if="status === 'webview-unsupported'" icon="info" title="不支援的瀏覽器環境">
          <template #sub-title>
            <p>為了確保所有功能正常運作，請使用您手機預設的瀏覽器開啟此頁面。</p>
          </template>
          <template #extra>
            <el-button type="primary" @click="handleOpenInBrowser">使用預設瀏覽器開啟</el-button>
            <el-alert
              title="點擊按鈕後，如果頁面沒有自動跳轉，請手動點擊角落的「...」選單，然後選擇「使用預設瀏覽器開啟」。"
              type="info"
              :closable="false"
              center
              style="margin-top: 20px;"
            />
          </template>
        </el-result>
        <el-result v-if="status === 'consent-required'" icon="info" title="授權請求">
          <template #sub-title>
            <div style="text-align: left; max-width: 320px; margin: 0 auto;">
              <p>為了將您的 LINE 帳號與 IFA 會員帳號連結，我們需要取得您的電子郵件地址。這將用於：</p>
              <el-steps direction="vertical" :space="50" style="height: 160px; margin: 20px 0; max-width: 100%;">
                <el-step title="驗證您的身分" />
                <el-step title="建立或連結您的 IFA 會員帳號" />
                <el-step title="接收重要的會員通知" />
              </el-steps>
              <p>我們承諾保護您的個人資訊安全。點擊「同意並以 LINE 登入」即表示您同意我們基於上述目的使用您的電子郵件。</p>
            </div>
          </template>
          <template #extra>
            <div class="consent-buttons">
              <el-button type="primary" @click="handleConsentAndLogin">同意並以 LINE 登入</el-button>
            </div>
          </template>
        </el-result>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { auth } from '@/firebaseConfig';
import liff from '@line/liff';
import { useAgentStore } from '@/stores/agent';
import { signInWithCustomToken } from 'firebase/auth';
import { isProblematicWebView } from '@/composables/useWebView';

const props = defineProps({
  liffInitError: {
    type: Error,
    default: null
  }
})

const agentStore = useAgentStore();
// --- LIFF 設定 ---
// 使用者強調：此 LIFF ID 為固定值，請勿改回環境變數。
const LIFF_ID = '2009612107-QeSJSRV2';
const status = ref('idle'); // idle, initializing, consent-required, logging-in, success, error, webview-unsupported
const errorMessage = ref('');
const showOverlay = ref(false);
const loadingText = ref('正在初始化服務...')
// Vite 環境變數，用於判斷是否為開發模式
const isDev = import.meta.env.DEV;

const proceedWithBackendLogin = async () => {
  try {
    console.log('[LineGuard] Starting backend login process...');
    // 此函式在確認使用者已登入 LIFF 且已授予 email 權限後呼叫。
    status.value = 'logging-in';
    loadingText.value = '正在驗證您的 LINE 帳號...';

    const decodedIDToken = liff.getDecodedIDToken();
    console.log('[LineGuard] Decoded LINE ID Token:', decodedIDToken);

    // 檢查 ID Token 是否已過期。exp 是以秒為單位的 Unix 時間戳。
    // 為避免後端驗證失敗 (IdToken expired)，在前端預先檢查。
    if (decodedIDToken?.exp && decodedIDToken.exp * 1000 < Date.now()) {
      console.warn('[LineGuard] LINE ID Token has expired. Re-initiating login flow.');
      loadingText.value = 'LINE 登入資訊已過期，將為您重新登入...';

      // 登出 LIFF 以清除過期的 session，這樣下次 liff.login() 才能重新觸發授權
      await liff.logout();

      // 顯示我們自訂的同意畫面，引導使用者重新點擊登入
      // 這會呼叫 handleConsentAndLogin -> liff.login()，以取得新的 ID Token
      status.value = 'consent-required';
      return;
    }

    const lineIdToken = liff.getIDToken();
    const email = decodedIDToken?.email;

    if (!email || !lineIdToken) {
      console.error('[LineGuard] Failed to get email or ID token from LIFF.');
      loadingText.value = '無法取得 LINE Email，將導向至網頁登入...';
      if (isDev) {
        console.warn('[LineGuard] DEV MODE: Aborting redirect. Reason: Could not get email from LIFF.');
        errorMessage.value = '[proceedWithBackendLogin] 開發模式：無法從 LINE 取得 Email。為保留 log 已中止重新導向。';
        status.value = 'error';
      } else {
        status.value = 'error';
        errorMessage.value = '[proceedWithBackendLogin] 無法從 LINE 取得必要的登入資訊。請依照提示操作，或聯絡客服人員。';
      }
      return;
    }
    
    console.log(`[LineGuard] Sending LINE ID Token to backend for email: ${email}`);
    loadingText.value = '已取得 LINE 帳號資訊，正在與伺服器同步...';
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/auth/line`;
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: lineIdToken }),
    });

    const authData = await response.json().catch(() => null);
    console.log('[LineGuard] Backend response:', { status: response.status, ok: response.ok, body: authData });

    if (!response.ok) {
        throw new Error(authData?.message || `後端伺服器錯誤: ${response.status}`);
    }

    if (authData?.status === 'SUCCESS') {
      const customToken = authData.customToken;
      console.log('[LineGuard] Received custom token from backend. Signing in with Firebase...');
      loadingText.value = '帳號同步完成，正在登入會員系統...';
      await signInWithCustomToken(auth, customToken);
      // 登入成功，將狀態設為 success 並隱藏遮罩
      console.log('[LineGuard] Firebase sign-in with custom token successful. Hiding overlay.');
      status.value = 'success';
      showOverlay.value = false;
      return;
    }

    if (authData?.status === 'USER_NOT_FOUND') {
      loadingText.value = '您的 LINE Email 尚未註冊，將導向至登入頁面...';
      console.log('[LineGuard] Backend reported USER_NOT_FOUND.');

      if (isProblematicWebView()) {
        // 在有問題的 WebView 中，FirebaseUI 彈窗會失敗。引導使用者切換瀏覽器。
        console.warn('[LineGuard] In a problematic WebView. Guiding user to switch browser for registration.');
        status.value = 'error';
        errorMessage.value = '您的 LINE 帳號尚未註冊。請點擊右上角選單，並選擇「在系統瀏覽器中開啟」，以完成註冊。';
      } else {
        // 在 LIFF 客戶端或標準瀏覽器中，直接嘗試退回至 FirebaseUI 登入流程。
        console.log('[LineGuard] In LIFF client. Attempting to fall back to Firebase login flow.');
        showOverlay.value = false;
        window.dispatchEvent(new CustomEvent('open-firebase-login'));
      }
      return;
    }

    throw new Error(authData?.message || '後端回傳未知的狀態');
  } catch (err: any) {
    console.error('Backend/Firebase Login Error:', err);
    errorMessage.value = `[proceedWithBackendLogin] ${err.message || '登入過程中發生未知錯誤，請稍後再試。'}`;
    status.value = 'error';
  }
}

const handleOpenInBrowser = () => {
  console.log('[LineGuard] User clicked "Open in Browser". Redirecting...');
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('openExternalBrowser', '1');
  window.location.replace(newUrl.toString());
};

const handleConsentAndLogin = async () => {
  console.log('[LineGuard] User consented. Initiating liff.login().');
  status.value = 'logging-in';
  loadingText.value = '即將跳轉至 LINE 進行授權...';
  try {
    // 1. 建立一個「乾淨」的 redirectUri，移除所有可能殘留的參數
    const url = new URL(window.location.href);
    url.hash = ''; // 移除 URL 中的 hash fragment，避免 SPA 路由影響 redirect_uri
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('liffClientId');
    url.searchParams.delete('liffRedirectUri');

    const redirectUri = url.toString();
    // 根據使用者要求，在執行 liff.login 前印出 redirectUri 以利除錯
    console.log('[LineGuard] Preparing to call liff.login() with redirectUri:', redirectUri);
    await liff.login({ // `scope` is not a valid property for `liff.login()`.
      // 明確指定重新導向的 URL 為當前頁面，避免跳轉到正式環境
      redirectUri: redirectUri
    });
    // liff.login() 會重新導向頁面，此函式在此之後的程式碼不會被執行。
  } catch (err: any) {
    // 這通常發生在使用者在 LINE 的同意畫面上點擊「取消」
    console.error('LIFF Login initiation failed:', err);
    errorMessage.value = `[handleConsentAndLogin] ${err.message || 'LINE 登入請求失敗，請再試一次。'}`;
    status.value = 'error';
  }
};

const initializeLiffAndLogin = async () => {
  console.log('[LineGuard] Initializing LIFF and login flow...');
  try {
    // ========================================================================
    // 步驟 1: 前置檢查 (Pre-flight Checks)
    // ========================================================================
    if (props.liffInitError) {
      // 如果 liff.init() 在 Layout 層就失敗了，檢查是否為 WebView 環境。
      if (isProblematicWebView()) {
        console.warn('[LineGuard] LIFF init failed in a problematic WebView. Showing "open in browser" message.');
        status.value = 'error';
        errorMessage.value = '系統初始化失敗，請嘗試使用預設瀏覽器開啟本頁。';
        return;
      }
      throw props.liffInitError;
    }
    console.log('[LineGuard] LIFF is pre-initialized. Proceeding with login flow.');

    // ========================================================================
    // 步驟 2: 環境判斷與分流 (Environment Branching)
    // 核心邏輯：根據執行的環境（LIFF App、App內建WebView、一般瀏覽器）決定登入流程。
    // ========================================================================
    const isLiffTestMode = new URLSearchParams(window.location.search).has('liff-test');

    // 情況 1: 在 LIFF App 中，或正在進行 LIFF 測試。這是最主要的登入路徑。
    if (liff.isInClient() || (isDev && isLiffTestMode)) {
      console.log(`[LineGuard] In LIFF client or test mode. Proceeding with LIFF login flow.`);
      loadingText.value = '正在檢查您的 LINE 登入狀態...';

      // 檢查使用者是否已經在 LIFF 層登入。
      if (liff.isLoggedIn()) {
        // 已登入 LIFF，檢查 email 權限並繼續後端登入流程
        const decodedIDToken = liff.getDecodedIDToken();
        if (!decodedIDToken?.email) {
          // 已登入但無 email 權限，可能是使用者撤銷了授權。
          // 登出 LIFF 以便下次能重新觸發完整的授權流程。
          console.log('[LineGuard] User is logged in to LIFF, but no email permission found. Logging out and requesting consent again.');
          await liff.logout();
          status.value = 'consent-required'; // 顯示 LIFF 同意畫面
        } else {
          // 已登入且有 email 權限，直接進行後端登入。
          console.log('[LineGuard] User is logged in to LIFF with email permission. Proceeding to backend login.');
          await proceedWithBackendLogin();
        }
      } else {
        // 未登入 LIFF，顯示我們自訂的同意畫面
        console.log('[LineGuard] User is not logged in to LIFF. Showing consent screen.');
        status.value = 'consent-required'; // 顯示 LIFF 同意畫面
      }
      return;
    }

    // 情況 2: 在有問題的 WebView 中 (但不是 LIFF App)。
    if (isProblematicWebView()) {
      const urlParams = new URLSearchParams(window.location.search);
      // 如果 URL 已經有 openExternalBrowser=1 參數，代表使用者已經點擊過按鈕但可能又返回了。
      // 這種情況下，我們顯示一個更通用的錯誤訊息，而不是再次顯示按鈕。
      if (urlParams.has('openExternalBrowser')) {
        console.log('[LineGuard] In a problematic WebView with flag. Displaying generic error.');
        status.value = 'error';
        errorMessage.value = '請使用您手機的預設瀏覽器（如 Chrome 或 Safari）開啟此頁面以完成操作。';
      } else {
        // 首次偵測到，顯示引導使用者操作的畫面。
        console.log('[LineGuard] In a problematic WebView (but not LIFF client). Displaying "open in browser" instructions.');
        status.value = 'webview-unsupported';
      }
      return;
    }

    // 情況 3: 在標準瀏覽器中。
    // 退回至標準的 Firebase 登入流程。
    console.log('[LineGuard] Normal browser environment detected. Falling back to standard Firebase login.');
    showOverlay.value = false;
    window.dispatchEvent(new CustomEvent('open-firebase-login'));

  } catch (err: any) {
    console.error('LIFF Flow Error (could be init or subsequent steps):', err);
    status.value = 'error';
    errorMessage.value = `[LIFF Flow] ${err.message || '發生未知錯誤'}`;
  }
};

const startLineLoginFlow = async () => {
    console.log('[LineGuard] start-line-login event or auto-start triggered. Starting flow...');

    // 防呆機制：直接檢查 Firebase 的當前使用者狀態。
    if (auth.currentUser) {
      console.warn('[LineGuard] Flow aborted: A Firebase user (auth.currentUser) already exists.');
      return;
    }

    // 第二層防護：檢查 agent store 的狀態。
    if (agentStore.isLoggedIn) {
      console.warn('[LineGuard] Flow aborted: User is already logged in according to the agent store.');
      return;
    }

    // --- 核心邏輯變更 ---
    // 舊方法是使用 onAuthStateChanged，但這會引入不必要的延遲，尤其是在 LIFF redirect 後，
    // 這個延遲會導致 liff.init() 無法及時處理 URL 參數而超時。
    // 新方法改為依賴 agentStore 的 isInitialized 狀態。
    // agentStore.init() 會在應用程式啟動時設定一個全域的 onAuthStateChanged 監聽器。
    // 我們只需等待這個全域監聽器完成首次檢查 (isInitialized 變為 true)，
    // 即可安全地、立即地繼續我們的 LIFF 流程，從而避免了競爭條件和延遲。
    if (!agentStore.isInitialized) {
      console.log('[LineGuard] Waiting for global auth state to be initialized...');
      await new Promise(resolve => {
        const unwatch = watch(() => agentStore.isInitialized, (initialized) => {
          if (initialized) {
            unwatch();
            resolve(true);
          }
        });
      });
      console.log('[LineGuard] Global auth state is now initialized.');
    }

    // 此時，agentStore.isInitialized 必定為 true，且 Firebase 的初始狀態已確定。
    // 我們可以安全地再次檢查 auth.currentUser，以防在等待期間有 session 被恢復。
    if (auth.currentUser) {
      console.log('[LineGuard] Firebase user detected after initialization. Aborting LIFF flow.');
      showOverlay.value = false;
      return;
    }

    showOverlay.value = true;
    status.value = 'initializing';
    console.log('[LineGuard] No active Firebase session. Proceeding with LIFF initialization.');
    initializeLiffAndLogin();
};

onMounted(async () => {
  // LIFF 初始化與 redirect 處理已移至 Layout.vue。
  // 此處僅需設定後續的登入流程觸發器。
  // For mobile devices, the flow is triggered by a click on the login avatar.
  window.addEventListener('start-line-login', startLineLoginFlow);

  const isProPage = window.location.pathname.includes('/pro/');
  const urlParams = new URLSearchParams(window.location.search);
  const isLiffTestMode = urlParams.has('liff-test');
  const shouldAutoStartForTest = isDev && isProPage && isLiffTestMode;

  // 在非 LIFF 的 WebView 或桌面測試模式下，自動啟動登入流程（首次進入頁面時）。
  if (isProblematicWebView() || shouldAutoStartForTest) {
    if (shouldAutoStartForTest) console.log('[LineGuard] LIFF test mode activated on page load.');
    if (isProblematicWebView()) console.log('[LineGuard] Problematic WebView detected. Auto-starting login flow.');
    
    startLineLoginFlow();
  }
});

onUnmounted(() => {
  window.removeEventListener('start-line-login', startLineLoginFlow);
})
</script>

<style scoped>
.line-guard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Darker overlay */
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
  box-sizing: border-box;
}

.line-guard-card {
  max-width: 420px;
  width: 100%;
}

/* 覆寫 el-result 的預設樣式以獲得更好的視覺效果 */
.line-guard-card :deep(.el-result__icon) {
  font-size: 48px;
}

.line-guard-card :deep(.el-result__title) {
  margin-top: 16px;
}

.line-guard-card :deep(.el-result__subtitle) {
  padding: 0 10px;
}

.line-guard-card :deep(.el-result__subtitle p) {
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.line-guard-card :deep(.el-result__extra) {
  margin-top: 24px;
}

.consent-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 280px; /* 避免按鈕在寬螢幕上過寬 */
  margin: 0 auto;
}

.consent-buttons .el-button + .el-button {
  margin-left: 0; /* 覆寫 Element Plus 在按鈕之間添加的左邊距 */
}
</style>