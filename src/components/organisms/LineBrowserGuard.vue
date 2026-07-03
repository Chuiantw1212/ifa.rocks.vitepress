<template>
  <div v-if="showOverlay" class="line-guard-overlay">
    <el-card class="line-guard-card" shadow="always" v-loading="status === 'initializing'" :element-loading-text="loadingText">
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

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 讓 TypeScript 認得從 CDN 載入的 liff 全域變數
declare const liff: any;

// --- LIFF 設定 ---
// 請到 LINE Developers Console > LIFF 頁面取得您的 LIFF ID
const LIFF_ID = '2009612107-QeSJSRV2';

const status = ref('idle'); // idle, initializing, success, error
const errorMessage = ref('');
const showOverlay = ref(false);
const currentUrl = ref('')
const loadingText = ref('正在初始化服務...')

// Vite 環境變數，用於判斷是否為開發模式
const isDev = import.meta.env.DEV;

const redirectToFirebaseLogin = () => {
  // 導向到 Firebase 登入頁面。在我們的應用中，這通常是主頁面 (`/pro/`)，
  // 因為登入模組 (LoginModule) 是在導航欄中。
  // 重要：我們刻意不將 `?liff-test=true` 參數帶到新的 URL，
  // 這樣在開發模式下重新導向後，頁面不會再次觸發 LIFF 流程，從而避免無限循環。
  const firebaseLoginUrl = `${window.location.origin}/pro/`;

  if (liff.isInClient()) {
    // 在 LIFF 環境中，使用 openWindow 在外部瀏覽器打開，體驗最佳
    liff.openWindow({ url: firebaseLoginUrl, external: true });
  } else {
    // 在普通網頁中，直接重新導向
    window.location.href = firebaseLoginUrl;
  }
};

const initializeLiffAndLogin = async () => {
  try {
    // Dynamically load LIFF SDK
    const script = document.createElement('script');
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
    document.head.appendChild(script);

    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('LIFF SDK 載入失敗。'));
    });

    // Initialize LIFF
    await liff.init({ liffId: LIFF_ID });

    // 【新流程】只要在 LINE App 內，就直接導向到外部瀏覽器進行 Firebase 網頁登入。
    // 同時，為了方便電腦開發，我們加入一個 URL 參數來手動模擬此行為，避免無限刷新。
    const isLiffTestMode = new URLSearchParams(window.location.search).has('liff-test');
    if (liff.isInClient() || (isDev && isLiffTestMode)) {
      loadingText.value = '偵測到 LINE 環境，正在將您導向至網頁登入...';
      redirectToFirebaseLogin();
      // 頁面即將跳轉，保持載入畫面直到跳轉完成。
    }
  } catch (err: any) {
    console.error('LIFF Error:', err);
    errorMessage.value = err.message || 'LIFF 初始化失敗，請確認網路連線或稍後再試。';
    status.value = 'error';
    // Keep the overlay visible to show the error and fallback message.
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