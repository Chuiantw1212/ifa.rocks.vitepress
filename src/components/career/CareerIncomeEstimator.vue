<template>
  <el-form label-position="top">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="目前年薪 (萬)">
          <el-input-number v-model="form.currentSalary" :min="0" :step="10" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="預期年薪成長率 (%)">
          <el-input-number v-model="form.growthRate" :min="0" :max="100" :step="1" style="width: 100%" />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="目前年齡">
          <el-input-number v-model="form.currentAge" :min="18" :max="100" style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="預計退休年齡">
          <el-input-number v-model="form.retirementAge" :min="form.currentAge || 18" :max="100" style="width: 100%" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-divider />

    <div v-if="totalEarnings > 0" class="result-section">
      <el-statistic title="預估職涯總收入" :value="totalEarnings">
        <template #suffix> 萬 </template>
      </el-statistic>
      <el-text size="small" type="info" style="margin-top: 8px;">
        這是一個基於您輸入資料的簡化預估，未考慮職涯中斷、轉職或通貨膨脹等因素。
        <br>
        想進行更詳細的薪資結構與未來現金流分析嗎？請往下填寫。
      </el-text>
    </div>
    <el-empty v-else description="請輸入上方欄位以進行快速預估" />
  </el-form>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'

const form = reactive({
  currentSalary: 50, // 預設 50 萬
  growthRate: 3,     // 預設 3%
  currentAge: 30,
  retirementAge: 65,
})

const totalEarnings = computed(() => {
  const { currentSalary, growthRate, currentAge, retirementAge } = form
  if (!currentSalary || !currentAge || !retirementAge || currentAge >= retirementAge) {
    return 0
  }

  let total = 0
  let salary = currentSalary
  const years = retirementAge - currentAge

  for (let i = 0; i < years; i++) {
    total += salary
    salary *= (1 + (growthRate || 0) / 100)
  }

  return Math.round(total)
})
</script>

<style scoped>
.result-section {
  text-align: center;
  padding: 16px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
}
</style>