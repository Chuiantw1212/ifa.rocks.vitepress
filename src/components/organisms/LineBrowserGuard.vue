<template>
  <div v-if="showOverlay" class="line-guard-overlay">
    <el-card class="line-guard-card" shadow="always" v-loading="status === 'initializing'" :element-loading-text="loadingText">
      <el-result
        v-if="status === 'success'"
        icon="success"
        title="登入成功"
        sub-title="正在為您載入應用程式..."
      />
      <el-result
        v-if="status === 'error'"
        icon="warning"
        :title="isDev ? 'LIFF 登入失敗' : '請使用預設瀏覽器開啟'"
      >
        <template #sub-title>
          <p>{{ errorMessage }}</p>
        </template>
        <template #extra>
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
          <el-alert
            v-if="isDev"
            title="請檢查瀏覽器開發者工具 (Console) 的錯誤訊息以進行除錯。"
            type="error"
            :closable="false"
          />
        </template>
      </el-result>
      <!-- This div is for the loading spinner to have a size -->
      <div v-if="status === 'initializing'" style="height: 280px;" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAgentStore } from '@/stores/agent'
import { jwtDecode } from 'jwt-decode';

// --- LIFF 設定 ---
// 請到 LINE Developers Console > LIFF 頁面取得您的 LIFF ID
const LIFF_ID = '2009612107-QeSJSRV2';

const status = ref('idle'); // idle, initializing, success, error
const errorMessage = ref('');
const showOverlay = ref(false);
const currentUrl = ref('')
const loadingText = ref('正在初始化服務...')

const agentStore = useAgentStore();

// Vite 環境變數，用於判斷是否為開發模式
const isDev = import.meta.env.DEV;

const initializeLiffAndLogin = async () => {
  try {
    // Dynamically load LIFF SDK
    const script = document.createElement('script');
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
    document.head.appendChild(script);

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => reject(new Error('LIFF SDK 載入失敗。'));
    });

    // Initialize LIFF
    await liff.init({ liffId: LIFF_ID });

    // 當在 LINE App 內，或是在開發模式下的電腦瀏覽器時，執行 LIFF 登入流程。
    // liff.isLoggedIn() 等函式在外部瀏覽器也能正常運作。
    if (liff.isInClient() || isDev) {
      if (!liff.isLoggedIn()) {
        // 如果使用者尚未登入 LINE，引導他們登入。
        // 登入後，LINE 會自動重新導向回此頁面，屆時 liff.isLoggedIn() 會是 true。
        loadingText.value = '偵測到 LINE 環境，正在引導您登入...';
        liff.login({ redirectUri: window.location.href });
      } else {
        // 使用者已登入 LINE，嘗試登入我們的系統
        loadingText.value = 'LINE 登入成功，正在驗證您的顧問身份...';
        // 【關鍵修正】liff.getIDToken() 是非同步操作，必須使用 await
        const idToken = await liff.getIDToken();
        if (!idToken) {
          throw new Error('無法取得 LINE ID Token，請確認 LIFF 已開啟 OpenID Connect 權限。');
        }

        // --- 開發模式下的除錯輔助 ---
        // 在將 Token 送到後端前，先在前端解碼並印出其內容，幫助後端除錯。
        // 這段程式碼只在開發環境 (isDev) 執行。
        if (isDev) {
          try {
            const decodedToken = jwtDecode(idToken);
            console.groupCollapsed('--- LIFF ID Token (Decoded for Debugging) ---');
            console.log('Audience (aud - 應為您的 Channel ID):', decodedToken.aud);
            console.log('Issuer (iss - 應為 https://access.line.me):', decodedToken.iss);
            console.log('Expires at (exp):', new Date(decodedToken.exp * 1000));
            console.log('Full Decoded Payload:', decodedToken);
            console.groupEnd();
          } catch (e) { console.error('無法解碼 LIFF ID Token，這可能是一個無效的 Token。', e); }
        }

        // 呼叫 Pinia store 的 action 來處理後續登入流程
        await agentStore.loginWithLiff(idToken);

        // 登入成功，顯示成功訊息
        status.value = 'success';

        // 1.5 秒後自動隱藏覆蓋層，讓使用者進入主畫面
        setTimeout(() => {
          showOverlay.value = false;
        }, 1500);
      }
    } else {
      // 在正式環境 (非 dev) 且不在 LINE App 中，我們就判定為錯誤的進入點。
      errorMessage.value = '此頁面僅支援在 LINE App 中開啟。';
      status.value = 'error';
    }
  } catch (err) {
    console.error('LIFF Error:', err);
    errorMessage.value = err.message || 'LIFF 登入失敗，建議使用外部瀏覽器開啟。';
    status.value = 'error';
    // Keep the overlay visible to show the error and fallback message.
  }
};

onMounted(() => {
  currentUrl.value = window.location.href;
  // 判斷是否需要啟動 LIFF 登入流程
  // 1. 在 LINE App 內瀏覽 /pro/ 相關頁面時
  // 2. 在開發模式下 (isDev)，於電腦瀏覽器瀏覽 /pro/ 相關頁面時
  const shouldTriggerLiff = window.location.pathname.includes('/pro/') && (navigator.userAgent.match(/Line/i) || isDev);

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