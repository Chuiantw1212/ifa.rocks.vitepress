<template>
  <el-card v-if="planningYearsDifference > 0" shadow="never">
    <template #header>
      <div style="display: flex; align-items: center; font-weight: bold; font-size: 16px;">
        <el-icon style="margin-right: 8px;"><Warning /></el-icon>
        <span>退休規劃的常見盲點：您可能低估了規劃年期</span>
      </div>
    </template>

    <!-- 上半部 -->
    <div>
      <el-text type="info">普遍認知</el-text>
      <p style="font-size: 14px; margin: 8px 0;">直接查閱內政部公告的平均餘命，以此作為規劃終點。</p>
      <div style="text-align: center; padding: 10px 0;">
        <el-statistic title="您的現在平均餘命為" :value="commonPlanningYears" suffix="年" />
      </div>
    </div>

    <el-divider />

    <!-- 中部 -->
    <div>
      <el-text type="danger">更精確的計算</el-text>
      <p style="font-size: 14px; margin: 8px 0;">考量到醫療進步，應將「到退休前的年數」與「退休後的預期餘命」相加。</p>
      <el-row align="middle" justify="center" style="text-align: center; padding: 10px 0;">
        <el-col :span="7">
          <div style="font-size: 28px; font-weight: bold; color: var(--el-text-color-primary);">{{ yearsToRetirement }}</div>
          <div style="font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px;">(距離退休年數)</div>
        </el-col>
        <el-col :span="2" style="font-size: 20px; color: var(--el-text-color-secondary);">+</el-col>
        <el-col :span="7">
          <div style="font-size: 28px; font-weight: bold; color: var(--el-text-color-primary);">{{ postRetirementYears }}</div>
          <div style="font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px;">(退休後餘命)</div>
        </el-col>
        <el-col :span="2" style="font-size: 20px; color: var(--el-text-color-secondary);">=</el-col>
        <el-col :span="6">
          <div style="font-size: 28px; font-weight: bold; color: var(--el-color-danger);">{{ actualPlanningYears }} <span style="font-size: 18px; color: var(--el-text-color-primary);">年</span></div>
          <div style="font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px;">(總規劃年期)</div>
        </el-col>
      </el-row>
    </div>

    <el-divider />

    <!-- 末尾 -->
    <div>
      <div style="display: flex; align-items: flex-start;">
        <el-icon style="margin-right: 8px; color: var(--el-color-warning); font-size: 18px; margin-top: 2px;"><Warning /></el-icon>
        <div>
          <p style="font-weight: bold; font-size: 16px; color: var(--el-text-color-primary); margin: 0; line-height: 1.5;">
            {{ `規劃年期相差了 ${planningYearsDifference} 年，這就是您被低估的長壽風險！` }}
          </p>
          <p style="line-height: 1.6; margin: 8px 0 0 0; font-size: 14px; color: var(--el-text-color-regular);">
            多數人習慣用「現在的平均餘命」來規劃，但忽略了當您退休時，平均餘命很可能已經變得更長。這個差異將導致退休金準備出現嚴重缺口。
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

// 普遍認知：直接查表，用現在的平均餘命
const commonPlanningYears = computed(() => clientPlan.value.profile?.lifeExpectancy || 0)

// 距離退休年數
const yearsToRetirement = computed(() => {
    const profile = clientPlan.value.profile;
    if (!profile || profile.retirementAge == null || profile.currentAge == null) {
        return 0;
    }
    const yearsToRetirement = profile.retirementAge - profile.currentAge;
    if (yearsToRetirement < 0) return 0;
    
    return yearsToRetirement;
})

// 退休後餘命
const postRetirementYears = computed(() => clientPlan.value.profile?.lifeExpectancyAtRetirement || 0)

// 正確的計算方式：(距離退休年數) + (退休後餘命)
const actualPlanningYears = computed(() => {
    if (yearsToRetirement.value > 0 && postRetirementYears.value > 0) {
        return yearsToRetirement.value + postRetirementYears.value;
    }
    return 0;
})

// 差異年數
const planningYearsDifference = computed(() => {
  const actual = actualPlanningYears.value;
  const common = commonPlanningYears.value;
  if (actual > 0 && common > 0 && actual > common) {
    return actual - common;
  }
  return 0;
})
</script>