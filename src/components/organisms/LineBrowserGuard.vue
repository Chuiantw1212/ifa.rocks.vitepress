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
            <ul style="padding-left: 20px; margin-top: 10px; margin-bottom: 10px;">
              <li>驗證您的身分</li>
              <li>建立或連結您的 IFA 會員帳號</li>
              <li>接收重要的會員通知</li>
            </ul>
            <p>我們承諾保護您的個人資訊安全。點擊「同意並以 LINE 登入」即表示您同意我們基於上述目的使用您的電子郵件。</p>
          </div>
        </template>
        <template #extra>
          <el-button type="primary" @click="handleConsentAndLogin">同意並以 LINE 登入</el-button>
        </template>
      </el-result>
      <!-- This div is for the loading spinner to have a size -->
      <div v-if="status === 'initializing' || status === 'logging-in'" style="height: 280px;" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
  const loginUrl = `${window.location.origin}/pro/`;

  if (liff.isInClient()) {
    // 在 LINE App 內，使用 openWindow 在外部瀏覽器開啟以獲得最佳體驗。
    liff.openWindow({ url: loginUrl, external: true });
    // 頁面即將跳轉，保持載入畫面直到跳轉完成。
  } else {
    // 在普通瀏覽器（例如開發模式），直接重新導向。
    window.location.href = loginUrl;
  }
};

const handleConsentAndLogin = async () => {
  status.value = 'logging-in';
  loadingText.value = '正在處理 LINE 登入...';
  try {
    // 1. 確保使用者已登入 LINE 並取得權限 (如果尚未登入，會觸發登入畫面)
    await liff.login({ scope: 'profile openid email' });

    // 2. 取得 LINE ID Token 和使用者 Email
    const lineIdToken = liff.getIDToken();
    const decodedIDToken = liff.getDecodedIDToken();
    const email = decodedIDToken?.email;

    // 3. 如果無法從 LINE 取得 Email，則導向至外部瀏覽器使用 FirebaseUI 登入
    if (!email || !lineIdToken) {
      loadingText.value = '無法取得 LINE Email，將導向至網頁登入...';
      redirectToExternalBrowserForLogin();
      return; // 停止後續執行
    }
    
    // 4. 將 LINE ID Token 送到後端
    loadingText.value = '正在驗證您的帳號...';
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/auth/line`;
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: lineIdToken }),
    });

    // 將 response body 只讀取一次，並處理非 JSON 的錯誤回應
    const authData = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(authData?.message || `後端伺服器錯誤: ${response.status}`);
    }

    // --- 情況 A: 成功登入 ---
    if (authData?.status === 'SUCCESS') {
      const customToken = authData.customToken;
      // 使用 customToken 呼叫 Firebase 的 signInWithCustomToken
      loadingText.value = '正在登入系統...';
      await signInWithCustomToken(auth, customToken);
      // 登入完成！agentStore 會處理後續流程
      return;
    }

    // --- 情況 B: 使用者不存在 ---
    if (authData?.status === 'USER_NOT_FOUND') {
      loadingText.value = '您的 LINE Email 尚未註冊，將導向至登入頁面...';
      redirectToExternalBrowserForLogin();
      return;
    }

    // --- 情況 C: 未知的後端狀態 ---
    throw new Error(authData?.message || '後端回傳未知的狀態');
    
    // agentStore 的 onAuthStateChanged 監聽器會處理後續邏輯 (如關閉對話框、顯示歡迎訊息)
    // 此處保持載入畫面，直到 onAuthStateChanged 完成其作業。
  } catch (err: any) {
    console.error('LIFF/Firebase Login Error:', err);
    errorMessage.value = err.message || '登入過程中發生未知錯誤，請稍後再試。';
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

    if (!liff.isLoggedIn()) {
      // 如果使用者沒有登入，顯示我們自訂的同意畫面
      status.value = 'consent-required';
    } else {
      // 如果已經登入，檢查是否有 email 權限
      const decodedIDToken = liff.getDecodedIDToken();
      if (!decodedIDToken?.email) {
        // 雖然已登入但沒有 email 權限，可能是使用者取消了授權
        // 或是舊的登入狀態沒有 email 權限，此時登出再重新登入來請求權限
        await liff.logout();
        status.value = 'consent-required';
      } else {
        // 已登入且有 email 權限，直接開始登入流程
        handleConsentAndLogin();
      }
    }
  } catch (err: any) {
    console.error('LIFF Initialization Error:', err);
    errorMessage.value = err.message || 'LIFF 初始化失敗，請確認網路連線或稍後再試。';
    status.value = 'error';
  }
};

onMounted(() => {
  currentUrl.value = window.location.href;
  // 判斷是否需要啟動 LIFF 登入流程
  // 1. 在 LINE App 內瀏覽 /pro/ 相關頁面
  // 2. 在開發模式下 (isDev)，且 URL 包含 ?liff-test=true 參數時
  const isLiffTestMode = new URLSearchParams(window.location.search).has('liff-test');
  const isLineBrowser = navigator.userAgent.match(/Line/i);
  const shouldTriggerLiff = window.location.pathname.includes('/pro/') && (isLineBrowser || (isDev && isLiffTestMode));

  if (shouldTriggerLiff) {
    showOverlay.value = true;
    status.value = 'initializing';
    initializeLiffAndLogin();
  }
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
</style>