<script setup>
import DefaultTheme from 'vitepress/theme'
import { useDynamicSidebar } from '@/composables/useDynamicSidebar'

const { Layout } = DefaultTheme

// 這個 Composable 會設定監聽器，自動更新側邊欄連結
useDynamicSidebar()
</script>

<template>
  <Layout />
</template>