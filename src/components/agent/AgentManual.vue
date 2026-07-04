<script setup>
import { User, DataLine, TrendCharts } from '@element-plus/icons-vue'
</script>

<template>
    <div class="agent-manual-container">
        <el-card shadow="never" style="border-radius: 12px; border: 1px solid #EBEEF5;">
            <template #header>
                <div class="card-header">
                    <span>歡迎使用 IFA 財務規劃系統</span>
                </div>
            </template>
            <div class="manual-content">
                <p>本系統是專為財務顧問 (IFA) 設計的專業工具，旨在協助您更有效率地為客戶提供理財規劃服務。</p>
                
                <el-divider />

                <h3>核心功能</h3>
                <el-row :gutter="20" class="features-row">
                    <el-col :md="8" :xs="24" class="feature-col">
                        <div class="feature-icon-wrapper">
                            <el-icon><User /></el-icon>
                        </div>
                        <h4>客戶管理</h4>
                        <p>輕鬆管理您的所有客戶資料，建立個人化的財務檔案，並隨時追蹤進度。</p>
                    </el-col>
                    <el-col :md="8" :xs="24" class="feature-col">
                        <div class="feature-icon-wrapper">
                            <el-icon><DataLine /></el-icon>
                        </div>
                        <h4>方案試算</h4>
                        <p>強大的勞保、勞退年金試算引擎，快速評估客戶的退休現金流。</p>
                    </el-col>
                    <el-col :md="8" :xs="24" class="feature-col">
                        <div class="feature-icon-wrapper">
                            <el-icon><TrendCharts /></el-icon>
                        </div>
                        <h4>專業形象</h4>
                        <p>透過系統化的數據分析與視覺化圖表，提升您在客戶心中的專業形象。</p>
                    </el-col>
                </el-row>

                <el-divider />

                <div class="login-prompt">
                    <p>請點擊頁面右上角的頭像圖示登入，開始您的財務規劃之旅。</p>
                </div>
            </div>
        </el-card>
    </div>
</template>

<style scoped>
.agent-manual-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}
.card-header {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
}
.manual-content h3 {
  text-align: center;
  margin-bottom: 24px;
  font-size: 18px;
}
.manual-content h4 {
  margin-bottom: 8px;
}
.manual-content p {
  line-height: 1.7;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
.login-prompt {
  text-align: center;
  margin-top: 24px;
}
.login-prompt p {
    color: var(--el-text-color-primary);
    font-weight: 500;
}
.features-row {
  text-align: center;
}
.feature-col {
  /* 在手機版堆疊時增加底部間距 */
  margin-bottom: 24px;
}
.feature-icon-wrapper {
  margin-bottom: 16px;
}
.feature-icon-wrapper .el-icon {
  font-size: 40px;
  color: var(--el-color-primary);
}
</style>