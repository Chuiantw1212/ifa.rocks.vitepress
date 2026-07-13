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
import LaborDependencyCard from '@/components/domain/labor/LaborDependencyCard.vue'
import LaborPensionCard from '@/components/domain/labor/LaborPensionCard.vue'
import LaborPensionChart from '@/components/domain/labor/LaborPensionChart.vue'
import LaborInsuranceCard from '@/components/domain/labor/LaborInsuranceCard.vue'
import LaborInsuranceChart from '@/components/domain/labor/LaborInsuranceChart.vue'
</script>
