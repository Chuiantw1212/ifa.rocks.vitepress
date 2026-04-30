<template>
  <el-card shadow="never" style="background-color: var(--el-color-info-light-9); border-color: var(--el-border-color-lighter);">
    <el-space direction="vertical" :size="16" style="width: 100%;">

      <el-text type="info">
        數據試算僅為單一情境之預估。真實的人生充滿通膨、市場波動與突發風險，完整的財富藍圖需要<el-text tag="strong">「攻守兼備」</el-text>的系統性規劃。
      </el-text>

      <el-button 
        type="primary" 
        size="large" 
        style="width: 100%;"
        @click="handleContactIFA"
      >
        接洽合作之 IFA 顧問進行專業諮詢
      </el-button>
      
      <el-row justify="center" style="width: 100%;">
        <el-text size="small" type="info">
          ✓ 客觀中立預測 &nbsp; ✓ 量身打造策略
        </el-text>
      </el-row>

    </el-space>
  </el-card>
</template>

<script setup>
const handleContactIFA = () => {
  // 這裡可以放入您的跳轉邏輯，例如：
  // router.push('/contact') 或 window.location.href = '您的預約表單連結'
  console.log('引導至 IFA 顧問接洽頁面');
}
</script>