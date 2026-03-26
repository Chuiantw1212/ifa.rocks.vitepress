<template>
  <div v-if="showOverlay" class="line-guard-overlay">
    <el-card class="line-guard-card" shadow="always" v-loading="status === 'initializing'" :element-loading-text="loadingText">
      <el-result
        v-if="status !== 'initializing'"
        icon="warning"
        title="請使用預設瀏覽器開啟"
      >
        <template #sub-title>
          <p>{{ status === 'error' ? errorMessage : '您似乎正在使用 LINE 的內建瀏覽器，這可能會導致部分功能無法正常運作。' }}</p>
        </template>
        <template #extra>
          <el-alert
            title="為了獲得最佳體驗，請點擊右上角的「...」選單，然後選擇「使用預設瀏覽器開啟」。"
            type="info"
            :closable="false"
            center
            style="margin-bottom: 20px;"
          />
          <el-button tag="a" :href="currentUrl" target="_blank" type="primary" link>
            或點此嘗試直接開啟
          </el-button>
        </template>
      </el-result>
      <!-- This div is for the loading spinner to have a size -->
      <div v-if="status === 'initializing'" style="height: 280px;"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// --- LIFF 設定 ---
// 請到 LINE Developers Console > LIFF 頁面取得您的 LIFF ID
const LIFF_ID = '2009612107-pP5vEEoY';

const status = ref('idle'); // idle, initializing, error
const errorMessage = ref('');
const showOverlay = ref(false);
const currentUrl = ref('')
const loadingText = ref('正在初始化服務...')

const initializeLiffAndRedirect = async () => {
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

    if (liff.isInClient()) {
      if (!liff.isLoggedIn()) {
        // 如果使用者尚未登入 LINE，引導他們登入。
        // 登入後，LINE 會自動重新導向回此頁面，屆時 liff.isLoggedIn() 會是 true。
        loadingText.value = '偵測到 LINE 環境，正在引導您登入...';
        liff.login({ redirectUri: window.location.href });
      } else {
        // 如果使用者已登入 LINE，則直接嘗試在外部瀏覽器開啟。
        loadingText.value = '登入成功，正在為您跳轉至預設瀏覽器...';
        liff.openWindow({
          url: window.location.href,
          external: true
        });
        // 頁面即將跳轉，但為防萬一，我們保留覆蓋層。
      }
    } else {
      // If not in a LINE client, we shouldn't be here. Hide the overlay.
      showOverlay.value = false;
    }
  } catch (err) {
    console.error('LIFF Error:', err);
    errorMessage.value = err.message || 'LIFF 初始化或跳轉失敗，建議您手動操作。';
    status.value = 'error';
    // Keep the overlay visible to show the error and fallback message.
  }
};

onMounted(() => {
  currentUrl.value = window.location.href;
  // Check if we are in the LINE client
  if (navigator.userAgent.match(/Line/i)) {
    showOverlay.value = true;
    status.value = 'initializing';
    initializeLiffAndRedirect();
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