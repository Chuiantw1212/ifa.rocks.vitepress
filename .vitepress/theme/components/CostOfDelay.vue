<template>
  <el-space direction="vertical" fill :size="24" style="width: 100%">
    <el-card>
      <template #header>
        <el-space>
          <el-avatar :size="24">1</el-avatar>
          <el-text tag="strong" size="large">目標定義</el-text>
        </el-space>
      </template>
      <el-form label-position="top">
        <el-form-item label="準備退休/圓夢金 (元)">
          <el-input-number v-model="targetAmount" :controls="false" :step="100000" size="large" style="width: 100%;" />
        </el-form-item>
        <el-space wrap>
          <el-button @click="targetAmount = 5000000" round>500萬</el-button>
          <el-button @click="targetAmount = 10000000" round>1000萬</el-button>
          <el-button @click="targetAmount = 20000000" round>2000萬</el-button>
        </el-space>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <el-space>
          <el-avatar :size="24">2</el-avatar>
          <el-text tag="strong" size="large">參數調整</el-text>
        </el-space>
      </template>
      <el-form label-position="top" :label-width="0">
        <el-form-item>
          <template #label>
            <el-row justify="space-between" style="width: 100%;">
              <el-text>預計達成時間</el-text>
              <el-text type="primary" tag="strong">{{ totalYears }} 年</el-text>
            </el-row>
          </template>
          <el-slider v-model="totalYears" :min="5" :max="40" />
        </el-form-item>
        <el-form-item>
          <template #label>
            <el-row justify="space-between" style="width: 100%;">
              <el-text>預期年化報酬率</el-text>
              <el-text type="primary" tag="strong">{{ returnRate }} %</el-text>
            </el-row>
          </template>
          <el-slider v-model="returnRate" :min="4" :max="8" :step="0.5" />
        </el-form-item>
        <el-divider>
          <el-text type="warning">⏳ 如果猶豫了...</el-text>
        </el-divider>
        <el-form-item>
          <template #label>
            <el-row justify="space-between" style="width: 100%;">
              <el-text type="danger" tag="strong">延遲年限</el-text>
              <el-text type="danger" tag="strong">{{ delayYears }} 年</el-text>
            </el-row>
          </template>
          <el-slider v-model="delayYears" :min="0" :max="totalYears - 1" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <el-space>
          <el-avatar :size="24">3</el-avatar>
          <el-text tag="strong" size="large">行動決策</el-text>
        </el-space>
      </template>

      <el-row justify="center" style="text-align: center;">
        <el-col>
          <el-statistic v-if="delayYears > 0" :value="penalty" :precision="0" title="每月需額外付出代價"
            :value-style="{ color: 'var(--el-color-danger)', fontSize: '2rem' }" prefix="+ $" />
          <el-statistic v-else title="現在開始是最好的時機"
            :value-style="{ color: 'var(--el-color-success)', fontSize: '2rem', fontWeight: '800' }">
            <template #formatter>最佳狀態</template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-divider />

      <el-row :gutter="20" justify="space-around" style="text-align: center;">
        <el-col :span="12">
          <el-statistic :value="pmtNow" :precision="0" title="現在開始 (月存)" />
        </el-col>
        <el-col :span="12" :style="{ opacity: delayYears === 0 ? 0.5 : 1 }">
          <el-statistic :value="pmtLater" :precision="0">
            <template #title>
              <el-text>晚 {{ delayYears }} 年 (月存)</el-text>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
    </el-card>
  </el-space>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTVM } from '../composables/useTVM'

const targetAmount = ref(10000000)
const totalYears = ref(20)
const returnRate = ref(6)
const delayYears = ref(0)
const { calcPMT } = useTVM()

const pmtNow = computed(() => {
  const monthlyRate = returnRate.value / 100 / 12
  const months = totalYears.value * 12
  return calcPMT(monthlyRate, months, targetAmount.value)
})

const pmtLater = computed(() => {
  const years = totalYears.value - delayYears.value
  if (years <= 0) return 0
  const monthlyRate = returnRate.value / 100 / 12
  const months = years * 12
  return calcPMT(monthlyRate, months, targetAmount.value)
})

const penalty = computed(() => pmtLater.value - pmtNow.value)
</script>