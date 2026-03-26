<script setup>
import DefaultTheme from 'vitepress/theme'
import { onMounted } from 'vue'
import { useData, withBase } from 'vitepress'
import { useDynamicSidebar } from '@/composables/useDynamicSidebar'
import { useAgent } from '@/composables/useAgent'
import LoginModule from '@/components/LoginModule.vue'

const { Layout } = DefaultTheme
const { frontmatter } = useData()

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
  <Layout>
    <template #nav-bar-content-after>
      <LoginModule />
    </template>
    <template #home-hero-image>
      <img
        v-if="frontmatter.hero && frontmatter.hero.image"
        class="custom-hero-image"
        :src="withBase(frontmatter.hero.image.src)"
        :alt="frontmatter.hero.image.alt"
        fetchpriority="high"
      />
    </template>
  </Layout>
</template>

<style scoped>
.custom-hero-image {
  /* 模仿 VitePress 預設主題的置中與大小設定 */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  /* Mobile First: 預設大小 (手機) */
  max-width: 192px;
  max-height: 192px;
}

/* 平板 */
@media (min-width: 640px) {
  .custom-hero-image {
    max-width: 256px;
    max-height: 256px;
  }
}

/* 桌面 */
@media (min-width: 960px) {
  .custom-hero-image {
    max-width: 320px;
    max-height: 320px;
  }
}
</style>
