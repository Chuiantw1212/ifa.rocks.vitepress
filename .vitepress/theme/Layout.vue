<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData, useRouter, useRoute } from 'vitepress'
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import LIFFInspectorPlugin from '@line/liff-inspector';
import liff from '@line/liff'
import { useDynamicSidebar } from '@/composables/useDynamicSidebar'
import { useAgent } from '@/composables/useAgent'
import { useAgentStore } from '@/stores/agent'
import { isProblematicWebView } from '@/composables/useWebView'
import LoginModule from '@/components/domain/auth/LoginModule.vue'
import LineBrowserGuard from '@/components/domain/auth/LineBrowserGuard.vue'
import HeroImage from './components/HeroImage.vue'

const { Layout } = DefaultTheme
const router = useRouter()
const route = useRoute()
const { theme } = useData()
const isDev = import.meta.env.DEV
const agentStore = useAgentStore()
let vConsoleInstance = null

// --- Layout Hooks ---
// 監聽 Agent (顧問) 狀態
// 這個 Composable 會設定監聽器，自動更新側邊欄連結
useDynamicSidebar()

// --- vConsole Management ---
// 監聽登入狀態，一旦使用者成功登入，就自動銷毀 vConsole。
watch(() => agentStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn && vConsoleInstance) {
    vConsoleInstance.destroy()
    vConsoleInstance = null
    console.log('[Layout] vConsole destroyed after successful login.')
  }
})

// --- LIFF Initialization Gate ---
// 根據使用者建議，我們在應用程式的最外層建立一個「閘門」。
// liff.init() 必須在應用程式完全可互動之前完成，以避免競爭條件和中斷。
const isAppReady = ref(false)
const liffInitError = ref(null)
// 使用者強調：此 LIFF ID 為固定值，請勿改回環境變數。
const LIFF_ID = '2009612107-QeSJSRV2'
const { initAgentListener } = useAgent()

/**
 * 路由守衛：保護 /pro/ 底下的頁面
 * 只有在使用者登入後，才允許存取 /pro/ 下的非儀表板頁面。
 * 這個 watch 會監聽路徑、登入狀態和 LIFF 初始化狀態的變化。
 */
watch(
  // 監聽三個關鍵狀態：路由物件、App準備狀態、使用者登入狀態
  [route, isAppReady, () => agentStore.isLoggedIn],
  ([currentRoute, appReady, isLoggedIn]) => {
    const path = currentRoute?.path

    // 當 App 準備就緒後，檢查使用者是否未登入就試圖存取受保護的頁面
    if (appReady && !isLoggedIn && path && path.startsWith('/pro/') && path !== '/pro/dashboard') {
      console.log(`[Route Guard] User not logged in. Redirecting from "${path}" to "/pro/dashboard".`)
      router.go('/pro/dashboard')
    }
  },
  {
    deep: true,       // 深度監聽 route 物件的變化
    immediate: true,  // 立即執行一次以處理初始載入
    flush: 'post'     // 確保在 DOM 更新後執行，拿到最準確的 route 狀態
  }
)

onMounted(async () => {
  // --- 初始設定 ---
  const content = document.querySelector('.VPContent')
  if (content && !content.querySelector('main')) {
    content.setAttribute('role', 'main')
  }

  // 確保在瀏覽器環境中執行
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)

    // --- 除錯工具初始化 (vConsole) ---
    // 根據使用者要求，為方便除錯，永遠在 onMounted 頂部優先載入 vConsole
    const isLiffTestMode = urlParams.has('liff-test')
    if (isProblematicWebView() || (isDev && isLiffTestMode)) {
      try {
        const VConsole = (await import('vconsole')).default
        vConsoleInstance = new VConsole()
        console.log('[Layout] vConsole initialized for debugging.')
      } catch (e) {
        console.error('Failed to initialize vConsole:', e)
      }
    }

    // --- LIFF 初始化 ---
    const isLiffRedirect = urlParams.has('code') && urlParams.has('state')
    // 僅在開發環境中初始化 LIFF Inspector，避免在正式環境載入不必要的除錯工具
    if (isDev) {
      liff.use(new LIFFInspectorPlugin({
        origin: 'wss://palpable-kimono-trimming.ngrok-free.dev'
      }))
    }

    try {
      console.log(`[Layout] Initializing LIFF (${LIFF_ID})...`)
      await liff.init({ liffId: LIFF_ID })
      console.log(`[Layout] LIFF (${LIFF_ID}) initialized successfully. Logged in: ${liff.isLoggedIn()}`)

      // 如果是從 LINE 授權後跳轉回來，liff.init() 會處理 URL 參數。
      // 處理完後，我們手動重新載入頁面並清除 URL 參數，以確保一個乾淨的狀態。
      // 這是為了避免使用者手動刷新頁面時，舊的 URL 參數導致 LIFF SDK 出錯。
      if (isLiffRedirect) {
        console.log('[Layout] LIFF redirect detected, cleaning URL and reloading...')
        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete('code')
        cleanUrl.searchParams.delete('state')
        cleanUrl.searchParams.delete('liffClientId')
        cleanUrl.searchParams.delete('liffRedirectUri')
        window.location.replace(cleanUrl.toString())
        // 頁面將會重新載入，後續的程式碼不會執行
        return
      }
    } catch (error) {
      console.error(`[Layout] LIFF (${LIFF_ID}) initialization failed:`, error)
      liffInitError.value = error
    } finally {
      // 在解除 UI 閘門之前，確保 Firebase 驗證狀態的監聽器已準備就緒。
      // 這確保了 LineBrowserGuard 中的登入流程可以被正確地監聽到。
      initAgentListener()

      // 無論成功或失敗，我們都將解除閘門，讓應用程式繼續渲染。
      // LineBrowserGuard 將會處理後續的登入邏輯或錯誤顯示。
      isAppReady.value = true
    }
  }
})
</script>

<template>
  <!-- 閘門：等待 App 初始化完成後再渲染主要內容 -->
  <template v-if="isAppReady">
    <LineBrowserGuard :liff-init-error="liffInitError" />
    <Layout>
      <template #nav-bar-content-after>
        <LoginModule />
      </template>
      <template #home-hero-image>
        <HeroImage />
      </template>
    </Layout>
  </template>
  <!-- App 準備就緒前的 Loading 畫面 -->
  <div v-else class="loading-container">
    <div class="loading-spinner"></div>
  </div>
</template>

<style scoped>
/* --- Loading Spinner --- */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--vp-c-bg);
  z-index: 999;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 5px solid var(--vp-c-brand-1);
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
