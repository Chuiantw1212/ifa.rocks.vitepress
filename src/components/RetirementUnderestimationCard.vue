<template>
  <el-card v-if="planningYearsDifference > 0" shadow="never">
    <template #header>
      <div style="display: flex; align-items: center; font-weight: bold; font-size: 16px;">
        <el-icon style="margin-right: 8px;"><Warning /></el-icon>
        <span>退休規劃的常見盲點：您可能低估了「退休後」的規劃年期</span>
      </div>
    </template>

    <!-- 上半部 -->
    <div>
      <el-text type="info">普遍認知</el-text>
      <p style="font-size: 14px; margin: 8px 0;">用「現在的平均餘命」推算退休後需要準備的年數。</p>
      <el-row align="middle" justify="center" style="text-align: center; padding: 10px 0;">
        <el-col :span="7">
          <div style="font-size: 28px; font-weight: bold; color: var(--el-text-color-primary);">{{ lifeExpectancy }}</div>
          <div style="font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px;">(現在餘命)</div>
        </el-col>
        <el-col :span="2" style="font-size: 20px; color: var(--el-text-color-secondary);">-</el-col>
        <el-col :span="7">
          <div style="font-size: 28px; font-weight: bold; color: var(--el-text-color-primary);">{{ yearsToRetirement }}</div>
          <div style="font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px;">(距離退休年數)</div>
        </el-col>
        <el-col :span="2" style="font-size: 20px; color: var(--el-text-color-secondary);">=</el-col>
        <el-col :span="6">
          <div style="font-size: 28px; font-weight: bold; color: var(--el-color-primary);">{{ commonPostRetirementYears }} <span style="font-size: 18px;">年</span></div>
          <div style="font-size: 12px; margin-top: 4px;">(預計準備年期)</div>
        </el-col>
      </el-row>
    </div>

    <el-divider />

    <!-- 中部 -->
    <div>
      <el-text type="danger">更精確的計算</el-text>
      <p style="font-size: 14px; margin: 8px 0;">考量到醫療進步，更安全的作法是直接採用國發會對您「退休那年的預期餘命」推估。</p>
      <div style="text-align: center; padding: 10px 0;">
        <el-statistic title="實際上應準備" :value="actualPostRetirementYears" suffix="年" :value-style="{ color: 'var(--el-color-danger)', fontSize: '32px', fontWeight: 'bold' }" />
      </div>
    </div>

    <el-divider />

    <!-- 末尾 -->
    <div>
      <div style="display: flex; align-items: flex-start;">
        <el-icon style="margin-right: 8px; color: var(--el-color-warning); font-size: 18px; margin-top: 2px;"><Warning /></el-icon>
        <div>
          <p style="font-weight: bold; font-size: 16px; color: var(--el-text-color-primary); margin: 0; line-height: 1.5;">
            {{ `您的退休準備年期可能低估了 ${planningYearsDifference} 年，相當於 ${underestimationPercentage.toFixed(0)}% 的缺口！` }}
          </p>
          <p style="line-height: 1.6; margin: 8px 0 0 0; font-size: 14px; color: var(--el-text-color-regular);">
            看似只差了幾年，但若以退休後的生活年數來看，這個差異將導致退休金準備出現嚴重缺口。
          </p>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAgent } from '@/composables/useAgent'
import { Warning } from '@element-plus/icons-vue'

const { agentPlan: clientPlan } = useAgent()

const lifeExpectancy = computed(() => clientPlan.value.profile?.lifeExpectancy || 0);

const yearsToRetirement = computed(() => {
    const profile = clientPlan.value.profile;
    if (!profile || profile.retirementAge == null || profile.currentAge == null) {
        return 0;
    }
    const years = profile.retirementAge - profile.currentAge;
    return years > 0 ? years : 0;
});

// 普遍認知：用 (現在餘命) - (距離退休年數)
const commonPostRetirementYears = computed(() => {
    const profile = clientPlan.value.profile;
    if (!profile || profile.currentAge == null || profile.lifeExpectancy == null || profile.retirementAge == null) {
        return 0;
    }
    // The calculation is equivalent to: lifeExpectancy - (retirementAge - currentAge)
    const expectedDeathAge = profile.currentAge + profile.lifeExpectancy;
    const years = expectedDeathAge - profile.retirementAge;
    return years > 0 ? Math.round(years) : 0;
})

// 更精確的計算：直接採用退休後的預期餘命
const actualPostRetirementYears = computed(() => clientPlan.value.profile?.lifeExpectancyAtRetirement || 0)

// 差異年數
const planningYearsDifference = computed(() => {
  const actual = actualPostRetirementYears.value;
  const common = commonPostRetirementYears.value;
  if (actual > 0 && common > 0 && actual > common) {
    return actual - common;
  }
  return 0;
})

// 低估的百分比
const underestimationPercentage = computed(() => {
    if (commonPostRetirementYears.value > 0 && planningYearsDifference.value > 0) {
        return (planningYearsDifference.value / commonPostRetirementYears.value) * 100;
    }
    return 0;
})
</script>