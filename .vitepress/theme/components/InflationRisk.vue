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
        <el-text tag="strong" size="large">2. 購買力模擬</el-text>
      </template>
      <el-form label-position="top">
        <el-form-item>
          <template #label>
            <el-row justify="space-between" style="width: 100%;">
              <el-text>經過年限</el-text>
              <el-text type="primary" tag="strong">{{ years }} 年</el-text>
            </el-row>
          </template>
          <el-slider v-model="years" :min="1" :max="30" />
        </el-form-item>
      </el-form>
      <el-divider />
      <el-row :gutter="20" justify="space-around" style="text-align: center;">
        <el-col :span="8">
          <el-statistic :value="nominalValue" :precision="0" title="帳面價值" />
        </el-col>
        <el-col :span="8">
          <el-statistic :value="realValue" :precision="0" title="實質購買力" />
        </el-col>
        <el-col :span="8">
          <el-statistic :value="evaporatedValue" :precision="0" title="無形蒸發"
            :value-style="{ color: 'var(--el-color-danger)' }" prefix="- " />
        </el-col>
      </el-row>
    </el-card>
  </el-space>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTVM } from '../composables/useTVM'
import type { Ref } from 'vue'

const principal: Ref<number> = ref(1000000)
const bankRate: Ref<number> = ref(1.7)
const inflationRate: Ref<number> = ref(3.0)
const years: Ref<number> = ref(10)

const { calcFV } = useTVM()

const nominalValue = computed(() => {
  return calcFV(bankRate.value / 100, years.value, 0, principal.value)
})

const realValue = computed(() => {
  // 實質購買力 = 帳面價值 / (1 + 通膨率)^年期
  // 這裡不適合使用為「年金」設計的 calcPV，而是直接使用單筆終值折現公式
  return nominalValue.value / Math.pow(1 + inflationRate.value / 100, years.value)
})

const evaporatedValue = computed(() => {
  return nominalValue.value - realValue.value
})
</script>