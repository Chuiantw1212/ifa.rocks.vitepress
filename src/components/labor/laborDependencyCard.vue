<template>
    <el-card shadow="never" style="margin-bottom: 20px;">
        <template #header>
            <div class="card-header">
                <span>資料相依性與連動設定</span>
            </div>
        </template>
        <el-form label-width="auto" label-position="top">
            <el-row :gutter="20" align="middle">
                <el-divider>職業收入</el-divider>
                <el-col :span="12" :xs="24">
                    <el-form-item label="勞退個人自提率 (%)">
                        <el-input-number v-if="careerData" v-model="careerData.pensionPersonalRate" :min="0" :max="6"
                            :step="1" style="width: 100%" @change="handleRateChange" />
                    </el-form-item>
                </el-col>
                <el-col :span="12" :xs="24">
                   <el-form-item  label="每月勞退提撥總額"  >
                        <el-input-number v-model="monthlyContributionPMT" disabled style="width: 100%" />
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { debounce } from '@/composables/debounce';
import { useCareerStore } from '@/stores/career';
import { useLaborPension } from '@/composables/useLaborPension';

const careerStore = useCareerStore();
const { data: careerData } = storeToRefs(careerStore);
const pension = useLaborPension(0, 0);

const monthlyContributionPMT = computed(() => careerData.value?.pensionTotalAmount || 0);

function formatMoney(val: number | undefined) {
    if (val === undefined) return '0';
    return Math.round(val).toLocaleString();
}

const handleRateChange = debounce(() => {
    if (!careerData.value) return;

    // --- 重新計算退休金提撥 ---
    // 此處邏輯與 CareerSalaryCalculator.vue 同步，以確保一致性
    const basis = (careerData.value.baseSalary || 0) + (careerData.value.otherAllowance || 0) + 3000;
    pension.actualWage.value = basis;
    pension.selfRate.value = careerData.value.pensionPersonalRate || 0;

    // 將計算結果更新回 career store
    careerData.value.pensionPersonalAmount = pension.selfAmount.value;
    careerData.value.pensionTotalAmount = pension.selfAmount.value + pension.employerAmount.value;

    // --- 重新計算總額以保持資料物件的完整性 ---
    const m = careerData.value;
    const monthlyGross = (m.baseSalary || 0) + (m.otherAllowance || 0) + 3000;
    const deductions = (m.pensionPersonalAmount || 0) + (m.stockDeduction || 0) + (m.laborInsurance || 0) + (m.healthInsurance || 0) + (m.otherDeduction || 0);
    m.monthlyNetIncome = monthlyGross - deductions;
    m.annualTotalIncome = (monthlyGross * 12) + (m.annualBonus || 0);

    // --- 觸發儲存 ---
    // career store 會處理 API 呼叫與後續狀態更新
    careerStore.saveCareerData();
}, 400);

</script>