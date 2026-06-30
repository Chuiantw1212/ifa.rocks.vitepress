<template>
    <el-card v-loading="isLoading"  shadow="never">
        <el-form :model="laborPensionData" label-width="auto" label-position="top">
            <el-divider>退休參數設定</el-divider>
            <el-row :gutter="20">
                <el-col :span="12" :xs="24">
                    <el-form-item :label="`預計請領年齡 (距請領 ${futureWorkYears} 年)`">
                        <el-input-number v-model="laborPensionData.expectedRetirementAge" :min="minClaimingAge"
                            :max="80" style="width: 100%" />
                    </el-form-item>
                </el-col>
                <el-col :span="12" :xs="24">
                    <el-form-item label="預估年化報酬率 (%)">
                        <el-input-number v-model="laborPensionData.retirementRoi" :precision="2" :step="0.5" :min="0" :max="15"
                            style="width: 100%" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-divider>現有資產明細 (PV)</el-divider>
            <el-row :gutter="20">
                <el-col :span="24">
                    <el-form-item
                        :label="`已累積年資 (${laborPensionData.currentWorkSeniority}月 ≈ ${(laborPensionData.currentWorkSeniority / 12).toFixed(1)}年)`"
                        required>
                        <el-input-number v-model="laborPensionData.currentWorkSeniority" :min="0" :max="720"
                            placeholder="輸入總月數" style="width: 100%">
                            <template #suffix>月</template>
                        </el-input-number>
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row :gutter="20">
                <el-col :span="12" :xs="24">
                    <el-form-item label="雇主提繳-累計金額">
                        <el-input-number v-model="laborPensionData.employerContribution" :min="0" :step="10000"
                            style="width: 100%" />
                    </el-form-item>
                </el-col>
                <el-col :span="12" :xs="24">
                    <el-form-item label="個人自提-累計金額">
                        <el-input-number v-model="laborPensionData.personalContribution" :min="0" :step="10000"
                        style="width: 100%" />
                    </el-form-item>
                </el-col>
                <el-col :span="12" :xs="24">
                    <el-form-item label="雇主提繳-累計收益">
                        <el-input-number v-model="laborPensionData.employerEarnings" :min="0" :step="5000"
                            style="width: 100%" />
                    </el-form-item>
                </el-col>
                <el-col :span="12" :xs="24">
                    <el-form-item label="個人自提-累計收益">
                        <el-input-number v-model="laborPensionData.personalEarnings" :min="0" :step="5000"
                            style="width: 100%" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-divider>試算結果 (FV)</el-divider>
            <el-row :gutter="20">
                <el-col :span="12" :xs="24">
                    <el-form-item label="退休時預估累計退休金">
                        <el-input :model-value="formatMoney(projectedLumpSum)" disabled />
                    </el-form-item>
                </el-col>
                <el-col :span="12" :xs="24">
                    <el-form-item label="一次請領預估稅金">
                        <el-input :model-value="formatMoney(lumpSumTaxResult.taxAmount)" disabled />
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { debounce } from '@/composables/debounce'
import type { ClientCareer } from '@/types/client-career';
import type { ClientLaborPension } from '@/types/client-labor-pension';
import type { ClientProfile } from '@/types/client-profile';
import { useLaborPensionStore } from '@/stores/labor';
import { useLumpSumTaxCalculator } from '@/composables/useLaborPension';
import { useClientsStore } from '@/stores/clients';
import { useCareerStore } from '@/stores/career';

const { calculateLumpSumTax } = useLumpSumTaxCalculator();
const laborPensionStore = useLaborPensionStore();
const { data: laborPensionData, isLoading } = storeToRefs(laborPensionStore);

const careerStore = useCareerStore();
const { data: careerData } = storeToRefs(careerStore);

const clientsStore = useClientsStore();
const { clientList, currentClientId } = storeToRefs(clientsStore);

const currentClientProfile = computed(() => {
    if (!currentClientId.value || !clientList.value) return null;
    return clientList.value.find(c => c.id === currentClientId.value) || null;
});

// --- 2. 基礎參數計算 ---
const currentYear = new Date().getFullYear();
const userBirthYear = computed(() => {
    const dateStr = currentClientProfile.value?.birthDate;
    if (!dateStr) return 1990;
    return new Date(dateStr).getFullYear();
});
const currentAge = computed(() => currentYear - userBirthYear.value);
const minClaimingAge = computed(() => Math.max(60, currentAge.value));

const futureWorkYears = computed(() => {
    if (!laborPensionData.value) return 0;
    const years = laborPensionData.value.expectedRetirementAge - currentAge.value;
    return years > 0 ? years : 0;
});

// --- 3. 資金參數 ---
const monthlyContributionPMT = computed(() => careerData.value?.pensionTotalAmount || 0);

const totalLaborPensionPV = computed(() => {
    const lp = laborPensionData.value;
    if (!lp) return 0;
    return (lp.employerContribution || 0) + (lp.employerEarnings || 0) + (lp.personalContribution || 0) + (lp.personalEarnings || 0);
});

const projectedLumpSum = computed(() => {
    if (!laborPensionData.value) return 0;
    const pv = totalLaborPensionPV.value;
    const pmt = monthlyContributionPMT.value * 12; // Annual PMT
    const rate = (laborPensionData.value.retirementRoi || 0) / 100;
    const nper = futureWorkYears.value;

    if (nper <= 0) return pv;
    if (rate === 0) return pv + pmt * nper;

    const fvFromPv = pv * Math.pow(1 + rate, nper);
    const fvFromPmt = pmt * ((Math.pow(1 + rate, nper) - 1) / rate);

    return Math.round(fvFromPv + fvFromPmt);
});

const totalYearsOfService = computed(() => {
    if (!laborPensionData.value) return 0;
    const currentServiceInYears = (laborPensionData.value.currentWorkSeniority || 0) / 12;
    return currentServiceInYears + futureWorkYears.value;
});

const lumpSumTaxResult = computed(() => {
    return calculateLumpSumTax(projectedLumpSum.value, totalYearsOfService.value);
});

watch(lumpSumTaxResult, (newVal) => {
    if (laborPensionData.value && newVal) {
        laborPensionData.value.predictedLumpSum = projectedLumpSum.value;
        laborPensionData.value.predictedNetLumpSum = newVal.netReceive;
    }
}, { immediate: true, deep: true });

function formatMoney(val: number | undefined) {
    if (val === undefined || isNaN(val)) return '0';
    return Math.round(val).toLocaleString();
}

async function performSave() {
    try {
        await laborPensionStore.saveLaborPensionData();
    } catch (error) {
        // 錯誤已由 store 處理 (ElMessage) 並重新拋出，此處無需重複處理
    }
}

const debouncedSave = debounce(performSave, 800);

// 當表單數值變動時，觸發自動存檔
watch(
    laborPensionData,
    (newVal) => { if (newVal) debouncedSave(); },
    { deep: true }
);
</script>