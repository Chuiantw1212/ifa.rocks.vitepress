<script setup>
import DefaultTheme from 'vitepress/theme'
import { onMounted, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import liff from '@line/liff'
import { useDynamicSidebar } from '@/composables/useDynamicSidebar'
import { useAgent } from '@/composables/useAgent'
import LoginModule from '@/components/organisms/LoginModule.vue'
import LineBrowserGuard from '@/components/organisms/LineBrowserGuard.vue'
import HeroImage from './components/HeroImage.vue'

const { Layout } = DefaultTheme

// --- Layout Hooks ---
// 監聽 Agent (顧問) 狀態
const { initAgentListener } = useAgent()
onMounted(() => {
  initAgentListener()
})

// 這個 Composable 會設定監聽器，自動更新側邊欄連結
useDynamicSidebar()

// --- SEO & Accessibility Fix ---
// 確保頁面一定有 <main> landmark
onMounted(() => {
  // The default theme should have a <main> tag inside .VPContent.
  // This is a fallback for cases where it might be missing.
  const content = document.querySelector('.VPContent')
  if (content && !content.querySelector('main')) {
    content.setAttribute('role', 'main')
  }
})

// --- LIFF Initialization Gate ---
// 根據使用者建議，我們在應用程式的最外層建立一個「閘門」。
// liff.init() 必須在應用程式完全可互動之前完成，以避免競爭條件和中斷。
const isLiffReady = ref(false)
const liffError = ref(null)
const LIFF_ID = import.meta.env.VITE_LIFF_ID

onMounted(async () => {
  // 僅在瀏覽器環境中執行
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const isLiffRedirect = urlParams.has('code') && urlParams.has('state')

    try {
      console.log('[Layout] Initializing LIFF...')
      await liff.init({ liffId: LIFF_ID })
      console.log('[Layout] LIFF initialized successfully.')

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
      console.error('[Layout] LIFF initialization failed:', error)
      liffError.value = error
    } finally {
      // 無論成功或失敗，我們都將解除閘門，讓應用程式繼續渲染。
      // LineBrowserGuard 將會處理後續的登入邏輯或錯誤顯示。
      isLiffReady.value = true
    }
  }
})
</script>

<template>
  <!-- 閘門：等待 LIFF 初始化完成後再渲染主要內容 -->
  <template v-if="isLiffReady">
    <LineBrowserGuard :liff-init-error="liffError" />
    <Layout>
      <template #nav-bar-content-after>
        <LoginModule />
      </template>
      <template #home-hero-image>
        <HeroImage />
      </template>
    </Layout>
  </template>
  <!-- 在此之前，頁面是空白的，可以加上一個 CSS-only 的 loading spinner -->
</template>

<style scoped>
</style>
