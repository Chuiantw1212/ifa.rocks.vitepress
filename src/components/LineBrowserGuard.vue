<template>
  <div v-if="isLineBrowser" class="line-guard-overlay">
    <el-card class="line-guard-card" shadow="always">
      <el-result
        icon="warning"
        title="請使用預設瀏覽器開啟"
      >
        <template #sub-title>
          <p>您似乎正在使用 LINE 的內建瀏覽器，這可能會導致部分功能 (如登入或報表產生) 無法正常運作。</p>
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isLineBrowser = ref(false)
const currentUrl = ref('')

onMounted(() => {
  if (navigator.userAgent.match(/Line/i)) {
    isLineBrowser.value = true
    currentUrl.value = window.location.href
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
  background-color: var(--vp-c-bg-soft);
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