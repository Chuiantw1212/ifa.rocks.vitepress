<script setup>
import DefaultTheme from 'vitepress/theme'
import { onMounted } from 'vue'
import { useData, withBase } from 'vitepress'
import { useDynamicSidebar } from '@/composables/useDynamicSidebar'
import { useAgent } from '@/composables/useAgent'
import LoginModule from '@/components/LoginModule.vue'
import LineBrowserGuard from '@/components/LineBrowserGuard.vue'
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
</script>

<template>
  <LineBrowserGuard />
  <Layout>
    <template #nav-bar-content-after>
      <LoginModule />
    </template>
    <template #home-hero-image>
      <HeroImage />
    </template>
  </Layout>
</template>

<style scoped>
</style>
