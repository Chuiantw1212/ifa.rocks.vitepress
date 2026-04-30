<template>
  <el-space direction="vertical" fill :size="24" style="width: 100%;">
    <el-card>
      <template #header>
        <el-text tag="strong" size="large">1. 資產與環境</el-text>
      </template>
      <el-form label-position="top">
        <el-form-item label="準備存入銀行的本金 (元)">
          <el-input-number v-model="principal" :controls="false" :step="100000" size="large" style="width: 100%;" />
          <el-space wrap style="margin-top: 8px;">
            <el-button size="small" round @click="principal = 500000">50萬</el-button>
            <el-button size="small" round @click="principal = 1000000">100萬</el-button>
            <el-button size="small" round @click="principal = 3000000">300萬</el-button>
          </el-space>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="銀行定存利率 (%)">
              <el-input-number v-model="bankRate" :min="0" :max="10" :step="0.1" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="預估年通膨率 (%)">
              <el-input-number v-model="inflationRate" :min="0" :max="15" :step="0.1" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <el-row justify="space-between" align="middle">
          <el-text tag="strong" size="large">2. 通膨有感指標</el-text>
          <el-text type="info" size="small">現在時間: 2026/03</el-text>
        </el-row>
      </template>
      <el-form label-position="top">
        <el-form-item>
          <template #label>
            <el-row justify="space-between" style="width: 100%;">
              <el-text>時間快轉到...</el-text>
              <el-text type="primary" tag="strong">
                {{ futureYear }} 年 ({{ years }} 年後)
              </el-text>
            </el-row>
          </template>
          <el-slider v-model="years" :min="1" :max="30" />
        </el-form-item>
      </el-form>
      <el-divider />
      <el-row :gutter="20" justify="space-around" style="text-align: center;">
        <el-col :span="12">
          <el-statistic :value="futureChickenPrice" :precision="0" title="🍗 雞排未來價格">
            <template #prefix>$ </template>
            <template #suffix>
              <el-text size="small" type="info" style="margin-left: 4px;">/ 原價 ${{ currentChickenPrice }}</el-text>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="12">
          <el-statistic :value="futureDrinkPrice" :precision="0" title="🥤 珍奶未來價格">
            <template #prefix>$ </template>
            <template #suffix>
              <el-text size="small" type="info" style="margin-left: 4px;">/ 原價 ${{ currentDrinkPrice }}</el-text>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <template #header>
        <el-text tag="strong" size="large">3. 購買力實測 (雞排+珍奶套餐)</el-text>
      </template>
      <el-row :gutter="20" justify="space-around" style="text-align: center;">
        <el-col :span="12">
          <el-statistic :value="setsToday" :precision="0" title="今天的本金可買">
            <template #suffix> 套</template>
          </el-statistic>
        </el-col>
        <el-col :span="12">
          <el-statistic :value="setsInFuture" :precision="0" title="未來的錢只夠買">
            <template #suffix> 套</template>
          </el-statistic>
        </el-col>
      </el-row>
      <el-divider />
      <el-row justify="center" style="text-align: center;">
        <el-statistic :value="setsLost" :precision="0" title="購買力無形中減少了" :value-style="{ color: 'var(--el-color-danger)' }">
          <template #suffix>
            套
            <el-text type="danger" size="small" style="margin-left: 4px;">({{ setsLostPercentage.toFixed(1) }}%)</el-text>
          </template>
        </el-statistic>
      </el-row>
    </el-card>
  </el-space>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTVM } from '../../composables/useTVM'
import type { Ref } from 'vue'

const principal: Ref<number> = ref(1000000)
const bankRate: Ref<number> = ref(1.0)
const inflationRate: Ref<number> = ref(3.0)
const years: Ref<number> = ref(10)

const currentChickenPrice: Ref<number> = ref(85)
const currentDrinkPrice: Ref<number> = ref(60)

const { calcFV } = useTVM()

const nominalValue = computed(() => {
  return calcFV(bankRate.value / 100, years.value, 0, principal.value)
})

const futureChickenPrice = computed(() => {
  return calcFV(inflationRate.value / 100, years.value, 0, currentChickenPrice.value)
})

const futureDrinkPrice = computed(() => {
  return calcFV(inflationRate.value / 100, years.value, 0, currentDrinkPrice.value)
})

const futureYear = computed<number>(() => {
  return 2026 + years.value
})

const currentSetPrice = computed<number>(() => {
  return currentChickenPrice.value + currentDrinkPrice.value
})

const futureSetPrice = computed<number>(() => {
  return futureChickenPrice.value + futureDrinkPrice.value
})

const setsToday = computed<number>(() => {
  if (currentSetPrice.value === 0) return 0
  return principal.value / currentSetPrice.value
})

const setsInFuture = computed<number>(() => {
  if (futureSetPrice.value === 0) return 0
  return nominalValue.value / futureSetPrice.value
})

const setsLost = computed<number>(() => {
  return setsToday.value - setsInFuture.value
})

const setsLostPercentage = computed<number>(() => {
  if (setsToday.value === 0) return 0
  return (setsLost.value / setsToday.value) * 100
})
</script>