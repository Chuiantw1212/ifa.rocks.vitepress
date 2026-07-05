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
        </el-result><el-result v-if="status === 'consent-required'" icon="info" title="授權請求">
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
import { ref, onMounted, onUnmounted } from 'vue';
import { auth } from '@/firebaseConfig';
import liff from '@line/liff';
import { useAgentStore } from '@/stores/agent';
import { signInWithCustomToken } from 'firebase/auth';
 
// --- LIFF 設定 ---
// 從環境變數讀取 LIFF ID，增加靈活性與安全性
const LIFF_ID = import.meta.env.VITE_LIFF_ID as string;
const status = ref('idle'); // idle, initializing, consent-required, logging-in, success, error
const errorMessage = ref('');
const showOverlay = ref(false);
const loadingText = ref('正在初始化服務...')
// Vite 環境變數，用於判斷是否為開發模式
const isDev = import.meta.env.DEV;

/**
 * 偵測當前環境是否為一個已知有問題的內嵌 WebView。
 * 這些環境通常會阻擋 OAuth 登入流程（如 Google 登入）。
 * @returns {boolean} 如果是已知的問題 WebView，則為 true。
 */
const isProblematicWebView = (): boolean => {
  // liff.isInClient() 是最可靠的判斷，如果我們在 LINE App 中，那它就不是「有問題」的 WebView。
  if (liff.isInClient()) {
    return false;
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

  // 已知的 App 內建瀏覽器特徵
  const isFacebook = /FBAV|FBAN/i.test(ua);
  const isInstagram = /Instagram/i.test(ua);

  // 通用 Android WebView 特徵
  const isAndroidWV = /wv/i.test(ua);

  // 通用 iOS WebView 特徵 (User Agent 是 iPhone/iPad 但不是 Safari)
  const isIOSWebView = /(iPhone|iPod|iPad)(?!.*Safari)/i.test(ua);

  const result = isFacebook || isInstagram || isAndroidWV || isIOSWebView;

  if (isDev) {
    console.log('[LineGuard] WebView Detection:', {
      ua,
      isFacebook,
      isInstagram,
      isAndroidWV,
      isIOSWebView,
      result
    });
  }

  return result;
};

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
    console.log(`[LineGuard] Calling liff.login() with redirectUri: ${redirectUri}`);
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
    // 為了避免 SSR build 錯誤 (XMLHttpRequest is not defined)，
    // 我們只在客戶端環境下才動態載入並初始化 vConsole。
    if (!import.meta.env.SSR) {
      const VConsole = (await import('vconsole')).default;
      new VConsole();
      console.log('[LineGuard] vConsole initialized.');
    }

    // 根據使用者要求，在呼叫 liff.init() 之前，先記錄當前的 Firebase 登入狀態。
    console.log('[LineGuard] Pre-init check. Firebase auth state:', auth.currentUser ? `Logged in as ${auth.currentUser.uid}` : 'Not logged in');

    // 初始化 LIFF
    // 現在 liff 是從 npm 套件 import，不再需要動態載入 script
    console.log(`[LineGuard] Calling liff.init() with LIFF ID: ${LIFF_ID}`);
    await liff.init({ liffId: LIFF_ID });
    console.log('[LineGuard] liff.init() successful.');

    const isLiffTestMode = new URLSearchParams(window.location.search).has('liff-test');

    // 判斷是否應退回至標準 Firebase 登入流程。
    // 條件：不在 LIFF 中，也不是有問題的 WebView，且不是開發者測試模式。
    const shouldFallbackToFirebase = !liff.isInClient() && !isProblematicWebView() && !(isDev && isLiffTestMode);

    if (shouldFallbackToFirebase) {
      console.log('[LineGuard] Normal browser environment detected. Falling back to standard Firebase login.');
      showOverlay.value = false;
      window.dispatchEvent(new CustomEvent('open-firebase-login'));
      return;
    }
    // 若為 LIFF 環境或 WebView，則繼續執行 LINE 登入流程。

    loadingText.value = '正在檢查您的 LINE 登入狀態...';

    // 在 init 之後，立即檢查 URL 是否包含 LIFF 的重新導向參數。
    // 如果有，表示我們剛從 LINE 的登入頁面跳轉回來。
    // 清理這些一次性的參數，可以避免在使用者重新整理頁面時，LIFF SDK 嘗試重複使用它們而導致錯誤。
    const url = new URL(window.location.href);
    if (url.searchParams.has('code')) {
      console.log('[LineGuard] Found LIFF redirect params in URL. Cleaning them up.');
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      url.searchParams.delete('liffClientId');
      url.searchParams.delete('liffRedirectUri');
      window.history.replaceState({}, document.title, url.toString());
    }

    console.log(`[LineGuard] liff.isLoggedIn() returned: ${liff.isLoggedIn()}`);
    if (liff.isLoggedIn()) {
      // 使用者已登入 LIFF，檢查 email 權限並繼續後端登入流程
      const decodedIDToken = liff.getDecodedIDToken();

      if (!decodedIDToken?.email) {
        // 已登入但無 email 權限，可能是使用者撤銷了授權。
        // 登出 LIFF 以便下次能重新觸發完整的授權流程。
        console.log('[LineGuard] User is logged in to LIFF, but no email permission found. Logging out and requesting consent again.');
        await liff.logout();
        status.value = 'consent-required';
      } else {
        // 已登入且有 email 權限，直接進行後端登入。
        console.log('[LineGuard] User is logged in to LIFF with email permission. Proceeding to backend login.');
        await proceedWithBackendLogin();
      }
    } else {
      // 使用者未登入 LIFF，顯示我們自訂的同意畫面
      console.log('[LineGuard] User is not logged in to LIFF. Showing consent screen.');
      status.value = 'consent-required';
    }
  } catch (err: any) {
    console.error('LIFF Initialization Error:', err);

    // LIFF 初始化失敗，檢查是否因為在 WebView 中。
    // 如果是，我們仍然嘗試顯示同意畫面，讓使用者有機會觸發 liff.login()。
    if (isProblematicWebView()) {
        console.warn('[LineGuard] LIFF init failed, likely in a WebView. Showing consent screen as a fallback.');
        status.value = 'consent-required';
        return;
    }

    // 如果不是 WebView，或偵測失敗，則退回標準 Firebase 登入流程。
    console.log('[LineGuard] LIFF init failed in a non-WebView environment. Falling back to standard Firebase login.');
    showOverlay.value = false;
    window.dispatchEvent(new CustomEvent('open-firebase-login'));
  }
};

const startLineLoginFlow = () => {
    console.log('[LineGuard] start-line-login event received. Starting flow...');

    // 防呆機制：直接檢查 Firebase 的當前使用者狀態。
    // 這比檢查 store 更即時，能更可靠地防止因 UI 重新渲染延遲而導致的競爭條件。
    if (auth.currentUser) {
      console.warn('[LineGuard] Flow aborted: A Firebase user (auth.currentUser) already exists.');
      return;
    }

    // 第二層防護：檢查 agent store 的狀態。
    // 這可以防止在 UI 重新渲染的空窗期，使用者重複點擊登入按鈕，導致流程卡死。
    if (useAgentStore().isLoggedIn) {
      console.warn('[LineGuard] Flow aborted: User is already logged in according to the agent store.');
      return;
    }

    showOverlay.value = true;
    status.value = 'initializing';

    // 透過 onAuthStateChanged 等待 Firebase 完成其初始狀態檢查。
    // 這可以防止在 Firebase 於背景恢復有效會話時，我們又嘗試進行 LIFF 登入，從而導致競態條件。
    console.log('[LineGuard] Setting up onAuthStateChanged listener to check for existing Firebase session...');
    const unsubscribe = auth.onAuthStateChanged(user => {
        console.log('[LineGuard] onAuthStateChanged callback triggered.');
        unsubscribe(); // 我們只需要在載入時檢查一次。
        if (user) {
            // 如果 Firebase 會話已存在，此防護元件的任務即告完成。
            console.log('[LineGuard] Firebase user already logged in. Aborting LIFF flow.');
            showOverlay.value = false;
        } else {
            // 如果沒有 Firebase 會話，才繼續執行 LIFF 登入流程。
            console.log('[LineGuard] No active Firebase session. Proceeding with LIFF initialization.');
            initializeLiffAndLogin();
        }
    });
};

onMounted(() => {
  // For mobile devices, the flow is triggered by a click on the login avatar.
  window.addEventListener('start-line-login', startLineLoginFlow);

  // For desktop testing, allow forcing the LIFF flow with a query parameter.
  const isLiffTestMode = new URLSearchParams(window.location.search).has('liff-test');
  const isProPage = window.location.pathname.includes('/pro/');

  if (isDev && isProPage && isLiffTestMode) {
    console.log('[LineGuard] LIFF test mode activated on page load.');
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