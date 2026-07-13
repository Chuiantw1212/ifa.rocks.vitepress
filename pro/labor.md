---
outline: deep
---
# 勞保與勞退

勞工保險（勞保）與勞工退休金（勞退）是構成您退休生活安全網的兩大基石。為了得到最精確的試算結果，建議您登入<a href="https://edesk.bli.gov.tw/me/#/home" target="_blank">勞保局e化服務系統</a>，將個人投保資料彙整後，填入下方欄位。

## 資料依賴
<ClientOnly>
  <LaborDependencyCard />
</ClientOnly>

## 勞工退休金

勞工退休金（勞退）是您退休後最重要的財務支柱之一。透過本系統的試算，您將清楚看見**個人自願提繳**對於未來退休金總額的巨大影響，這也是加速累積退休資產的關鍵策略。

### 表單

<ClientOnly>
  <LaborPensionCard />
</ClientOnly>

### 圖表

<ClientOnly>
  <LaborPensionChart />
</ClientOnly>


## 勞工保險

勞工保險（勞保）提供老年年金給付，但許多人對於「展延年金」（俗稱晚退）有過度樂觀的期待。此處的分析將為您揭示，在將**通貨膨脹**與**平均餘命**納入考量後，延後請領的實質效益可能不如預期，幫助您做出最適合的請領決策。

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
