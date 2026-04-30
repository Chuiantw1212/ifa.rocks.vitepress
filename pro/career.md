# 職業規劃

您的職涯是累積財富最重要的引擎。透過簡單的幾個數字，我們可以窺見您未來的收入潛力，並思考如何將這份潛力最大化，轉化為支持您理想生活的燃料。

<br />

<el-card shadow="hover" style="max-width: 600px; margin: 0 auto; margin-bottom: 24px;">
  <template #header>
    <div style="font-weight: bold; font-size: 1.2em;">🚀 快速預估您的未來總收入</div>
  </template>
  <CareerIncomeEstimator />
</el-card>

## 詳細薪資結構試算

在了解了宏觀的總收入潛力後，我們可以進一步分析您目前的薪資結構。這將幫助您了解每個月的實際現金流、各項社會保險的提撥情況，以及可以優化的空間。

<ClientOnly>
  <CareerSalaryCalculator v-model="careerData" />
</ClientOnly>

<script setup>
import { ref } from 'vue'
import CareerIncomeEstimator from '@/components/career/CareerIncomeEstimator.vue'
import CareerSalaryCalculator from '@/components/career/CareerSalaryCalculator.vue'

const careerData = ref({
    baseSalary: 50000,
    otherAllowance: 0,
    laborInsurance: 0,
    healthInsurance: 0,
    otherDeduction: 0,
    pensionPersonalRate: 0,
    dependents: 0,
    annualBonus: 0,
})
</script>
