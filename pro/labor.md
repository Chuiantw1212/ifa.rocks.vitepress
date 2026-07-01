---
outline: deep
---
# 勞保與勞退

## 資料依賴
<ClientOnly>
  <LaborDependencyCard />
</ClientOnly>

## 勞工退休金

### 表單

<ClientOnly>
  <LaborPensionCard />
</ClientOnly>

### 圖表

<ClientOnly>
  <LaborPensionChart />
</ClientOnly>


## 勞工保險

### 表單

<ClientOnly>
  <LaborInsuranceCard />
</ClientOnly>

### 圖表

<ClientOnly>
  <LaborInsuranceChart />
</ClientOnly>

<script setup>
import LaborDependencyCard from '@/components/labor/LaborDependencyCard.vue'
import LaborPensionCard from '@/components/labor/LaborPensionCard.vue'
import LaborPensionChart from '@/components/labor/LaborPensionChart.vue'
import LaborInsuranceCard from '@/components/labor/LaborInsuranceCard.vue'
import LaborInsuranceChart from '@/components/labor/LaborInsuranceChart.vue'
</script>
