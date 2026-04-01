<script setup>
import { useData, withBase } from 'vitepress'

const { frontmatter } = useData()
const imageBase = '/logo/white_transparent_'
</script>

<template>
  <picture v-if="frontmatter.hero && frontmatter.hero.image">
    <source
      :srcset="withBase(`${imageBase}320.webp`)"
      media="(min-width: 960px)"
    >
    <img
      class="custom-hero-image"
      :src="withBase(`${imageBase}192.webp`)"
      :alt="frontmatter.hero.image.alt"
      fetchpriority="high"
    >
  </picture>
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
