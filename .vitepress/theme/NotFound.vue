<template>
  <div class="not-found-container">
    <h1>404 - 頁面不存在</h1>
    <p>您想找的頁面不存在，我們將為您導向首頁。</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vitepress';

const { go } = useRouter();

onMounted(() => {
  // Redirect to the homepage
  go('/');
});
</script>

<style scoped>
.not-found-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100vh - var(--vp-nav-height));
  text-align: center;
}
</style>