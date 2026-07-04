<template>
  <div v-if="showOverlay" class="line-guard-overlay">
    <el-card class="line-guard-card" shadow="always" v-loading="status === 'initializing'" :element-loading-text="loadingText" style="text-align: center;">
      <el-result
        v-if="status === 'error'"
        icon="warning"
        :title="isDev ? 'LIFF 登入失敗' : '請使用預設瀏覽器開啟'"
      >
        <template #sub-title>
          <p>{{ errorMessage }}</p>
        </template>
        <template #extra>
          <div>
            <el-alert
              v-if="!isDev"
              title="為了獲得最佳體驗，請點擊右上角的「...」選單，然後選擇「使用預設瀏覽器開啟」。"
              type="info"
              :closable="false"
              center
              style="margin-bottom: 20px;"
            />
            <el-button v-if="!isDev" tag="a" :href="currentUrl" target="_blank" type="primary" link>
              或點此嘗試直接開啟
            </el-button>
          </div>
          <el-alert
            v-if="isDev"
            title="請檢查瀏覽器開發者工具 (Console) 的錯誤訊息以進行除錯。"
            type="error"
            :closable="false"
          />
        </template>
      </el-result>
      <el-result
        v-if="status === 'consent-required'"
        icon="info"
        title="授權請求"
      >
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
            <el-button @click="showExternalBrowserInstructions">使用其他方式登入</el-button>
          </div>
        </template>
      </el-result>
      <!-- This div is for the loading spinner to have a size -->
      <div v-if="status === 'initializing' || status === 'logging-in'" style="height: 280px;" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { auth } from '@/firebaseConfig';
import { signInWithCustomToken } from 'firebase/auth';
import { useAgentStore } from '@/stores/agent';

// 讓 TypeScript 認得從 CDN 載入的 liff 全域變數
declare const liff: any;

// --- LIFF 設定 ---
const LIFF_ID = '2009612107-QeSJSRV2';

const status = ref('idle'); // idle, initializing, consent-required, logging-in, success, error
const errorMessage = ref('');
const showOverlay = ref(false);
const currentUrl = ref('')
const loadingText = ref('正在初始化服務...')
// Vite 環境變數，用於判斷是否為開發模式
const isDev = import.meta.env.DEV;
const agentStore = useAgentStore();

const redirectToExternalBrowserForLogin = () => {
  // 導向到應用程式的主登入頁面 (`/pro/`)，FirebaseUI 會在那裡處理登入。
  const loginUrl = `${window.location.origin}/pro/dashboard`;
  if (liff.isInClient()) {
    // 嘗試在外部瀏覽器中開啟登入頁面。
    // 這是一個「即發即忘」的操作，我們無法得知它是否成功。
    liff.openWindow({ url: loginUrl, external: true });
    // 因此，我們立即更新 UI，提供手動操作的備用說明。
    // 這樣即使用戶切換回 LINE，或 openWindow 失敗，他們也能看到清晰的指引。
    status.value = 'error';
    errorMessage.value = '為了使用 Google 或其他方式登入，我們已嘗試為您開啟手機的預設瀏覽器。';
  } else {
    // 在普通瀏覽器（例如開發模式），直接重新導向。
    window.location.href = loginUrl;
  }
};

const showExternalBrowserInstructions = () => {
  // 根據使用者要求，此按鈕現在會嘗試自動開啟外部瀏覽器
  redirectToExternalBrowserForLogin();
};

const proceedWithBackendLogin = async () => {
  try {
    // 此函式在確認使用者已登入 LIFF 且已授予 email 權限後呼叫。
    status.value = 'logging-in';
    loadingText.value = '正在驗證您的帳號...';

    const decodedIDToken = liff.getDecodedIDToken();

    // 檢查 ID Token 是否已過期。exp 是以秒為單位的 Unix 時間戳。
    // 為避免後端驗證失敗 (IdToken expired)，在前端預先檢查。
    if (decodedIDToken && decodedIDToken.exp * 1000 < Date.now()) {
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
      loadingText.value = '無法取得 LINE Email，將導向至網頁登入...';
      if (isDev) {
        console.warn('[LineGuard] DEV MODE: Aborting redirect. Reason: Could not get email from LIFF.');
        errorMessage.value = '開發模式：無法從 LINE 取得 Email。為保留 log 已中止重新導向。';
        status.value = 'error';
      } else {
        redirectToExternalBrowserForLogin();
      }
      return;
    }
    
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/auth/line`;
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: lineIdToken }),
    });

    const authData = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(authData?.message || `後端伺服器錯誤: ${response.status}`);
    }

    if (authData?.status === 'SUCCESS') {
      const customToken = authData.customToken;
      loadingText.value = '正在登入系統...';
      await signInWithCustomToken(auth, customToken);
      // 登入成功，將狀態設為 success 並隱藏遮罩
      status.value = 'success';
      showOverlay.value = false;
      return;
    }

    if (authData?.status === 'USER_NOT_FOUND') {
      loadingText.value = '您的 LINE Email 尚未註冊，將導向至登入頁面...';
      // 不要自動重新導向，因為 liff.openWindow 不可靠。
      // 直接顯示錯誤畫面，引導使用者手動操作。
      showExternalBrowserInstructions();
      return;
    }

    throw new Error(authData?.message || '後端回傳未知的狀態');
  } catch (err: any) {
    console.error('Backend/Firebase Login Error:', err);
    errorMessage.value = err.message || '登入過程中發生未知錯誤，請稍後再試。';
    status.value = 'error';
  }
}

const handleConsentAndLogin = async () => {
  status.value = 'logging-in';
  loadingText.value = '正在處理 LINE 登入...';
  try {
    // 1. 建立一個「乾淨」的 redirectUri，移除所有可能殘留的參數
    const url = new URL(window.location.href);
    url.hash = ''; // 移除 URL 中的 hash fragment，避免 SPA 路由影響 redirect_uri
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('liffClientId');
    url.searchParams.delete('liffRedirectUri');

    await liff.login({
      scope: 'profile openid email',
      // 明確指定重新導向的 URL 為當前頁面，避免跳轉到正式環境
      redirectUri: url.toString()
    });
    // liff.login() 會重新導向頁面，此函式在此之後的程式碼不會被執行。
  } catch (err: any) {
    // 這通常發生在使用者在 LINE 的同意畫面上點擊「取消」
    console.error('LIFF Login initiation failed:', err);
    errorMessage.value = err.message || 'LINE 登入請求失敗，請再試一次。';
    status.value = 'error';
  }
};

const initializeLiffAndLogin = async () => {
  try {
    // 動態載入 LIFF SDK
    const script = document.createElement('script');
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
    document.head.appendChild(script);

    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('LIFF SDK 載入失敗。'));
    });

    // 初始化 LIFF
    await liff.init({ liffId: LIFF_ID });

    // 在 init 之後，立即檢查 URL 是否包含 LIFF 的重新導向參數。
    // 如果有，表示我們剛從 LINE 的登入頁面跳轉回來。
    // 清理這些一次性的參數，可以避免在使用者重新整理頁面時，LIFF SDK 嘗試重複使用它們而導致錯誤。
    const url = new URL(window.location.href);
    if (url.searchParams.has('code')) {
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      url.searchParams.delete('liffClientId');
      url.searchParams.delete('liffRedirectUri');
      window.history.replaceState({}, document.title, url.toString());
    }

    if (liff.isLoggedIn()) {
      // 使用者已登入 LIFF，檢查 email 權限並繼續後端登入流程
      const decodedIDToken = liff.getDecodedIDToken();
      if (isDev) {
        console.log('[LineGuard] Decoded ID Token:', decodedIDToken);
      }

      if (!decodedIDToken?.email) {
        // 已登入但無 email 權限，可能是使用者撤銷了授權。
        // 登出 LIFF 以便下次能重新觸發完整的授權流程。
        await liff.logout();
        status.value = 'consent-required';
      } else {
        // 已登入且有 email 權限，直接進行後端登入。
        await proceedWithBackendLogin();
      }
    } else {
      // 使用者未登入 LIFF，顯示我們自訂的同意畫面
      status.value = 'consent-required';
    }
  } catch (err: any) {
    console.error('LIFF Initialization Error:', err);
    errorMessage.value = err.message || 'LIFF 初始化失敗，請確認網路連線或稍後再試。';
    status.value = 'error';
  }
};

const startLineLoginFlow = () => {
    currentUrl.value = window.location.href;
    showOverlay.value = true;
    status.value = 'initializing';

    // 透過 onAuthStateChanged 等待 Firebase 完成其初始狀態檢查。
    // 這可以防止在 Firebase 於背景恢復有效會話時，我們又嘗試進行 LIFF 登入，從而導致競態條件。
    const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe(); // 我們只需要在載入時檢查一次。
        if (user) {
            // 如果 Firebase 會話已存在，此防護元件的任務即告完成。
            showOverlay.value = false;
        } else {
            // 如果沒有 Firebase 會話，才繼續執行 LIFF 登入流程。
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