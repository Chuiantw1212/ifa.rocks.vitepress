---
title: 個案財務摘要
description: 高氏家庭理財規劃書摘要預覽
outline: deep
---

<script setup>
import { ref } from 'vue'

// === 預覽用的靜態假資料 (Mock Data) ===
// 待未來與 Neon Serverless Postgres 對接後，可替換為 API 獲取之資料
const netWorth = ref(23850)       // 總淨值 (萬元)
const annualSurplus = ref(213)    // 年度結餘 (萬元)
const healthScore = ref(85)       // 財務健康分數
</script>

# 個案背景與財務摘要

> **系統提示**：此頁面為預覽模式，展示 IFA 系統生成之個案摘要排版效果。完整系統仍在開發中，試用請點左側客戶總預覽

<el-divider />

### 家庭基本輪廓

<el-card shadow="never" style="margin-bottom: 24px;">
  <el-descriptions :column="2" border>
    <el-descriptions-item label="主要委託人">高大志 先生 (60歲)</el-descriptions-item>
    <el-descriptions-item label="配偶">王美美 女士 (59歲)</el-descriptions-item>
    <el-descriptions-item label="家庭成員">育有 2 子 1 女，含長輩共 5 名扶養親屬</el-descriptions-item>
    <el-descriptions-item label="職業背景">太陽貿易公司 企業主</el-descriptions-item>
    <el-descriptions-item label="風險屬性">穩健保守型 (最大可承受本金損失 10%)</el-descriptions-item>
    <el-descriptions-item label="規劃重點">退休現金流、二代購屋資金、企業股權傳承</el-descriptions-item>
  </el-descriptions>
</el-card>

### 財務健康快照

<el-row :gutter="20" style="margin-bottom: 24px;">
  <el-col :xs="24" :md="8" style="margin-bottom: 16px;">
    <el-card shadow="hover" style="text-align: center;">
      <el-statistic title="當前家庭總淨值 (預估)" :value="netWorth" suffix=" 萬元" />
    </el-card>
  </el-col>
  <el-col :xs="24" :md="8" style="margin-bottom: 16px;">
    <el-card shadow="hover" style="text-align: center;">
      <el-statistic title="年度收支結餘" :value="annualSurplus" suffix=" 萬元" />
    </el-card>
  </el-col>
  <el-col :xs="24" :md="8">
    <el-card shadow="hover" style="text-align: center;">
      <el-statistic title="整體財務健康分數" :value="healthScore" suffix=" / 100" />
    </el-card>
  </el-col>
</el-row>

### 核心理財目標總覽

<el-row :gutter="20" style="margin-bottom: 32px;">
  <el-col :xs="24" :md="8" style="margin-bottom: 16px;">
    <el-card shadow="hover" style="height: 100%;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600;">🏖️ 樂活退休規劃</span>
          <el-tag type="success" effect="dark">10年後</el-tag>
        </div>
      </template>
      <div style="color: var(--vp-c-text-2); font-size: 14px; line-height: 1.6;">
        目標：70歲退休，每月維持現值 10 萬元之生活品質，並確保提領期至 100 歲。
      </div>
    </el-card>
  </el-col>
  
  <el-col :xs="24" :md="8" style="margin-bottom: 16px;">
    <el-card shadow="hover" style="height: 100%;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600;">🏠 二代購屋基金</span>
          <el-tag type="warning" effect="dark">3-6年內</el-tag>
        </div>
      </template>
      <div style="color: var(--vp-c-text-2); font-size: 14px; line-height: 1.6;">
        目標：為長子與次子各準備 2,000 萬元（現值）之頭期款，並考量房價通膨風險。
      </div>
    </el-card>
  </el-col>

  <el-col :xs="24" :md="8" style="margin-bottom: 16px;">
    <el-card shadow="hover" style="height: 100%;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600;">⚖️ 家族資產傳承</span>
          <el-tag type="danger" effect="dark">長期</el-tag>
        </div>
      </template>
      <div style="color: var(--vp-c-text-2); font-size: 14px; line-height: 1.6;">
        目標：妥善規劃公司股權與不動產轉移，預留足夠稅源，避免未來繼承爭議。
      </div>
    </el-card>
  </el-col>
</el-row>

<el-alert
  title="接下來，建議您前往【貳、財務現況診斷】檢視詳細的資產負債結構與現金流。"
  type="info"
  show-icon
  :closable="false"
/>