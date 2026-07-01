<template>
    <el-card v-loading="isLoading" shadow="never">
        <el-form v-if="laborInsuranceData" :model="laborInsuranceData" label-width="auto" label-position="top">

            <el-divider>投保參數設定</el-divider>

            <el-row :gutter="20">

                <el-col :span="12" :xs="24">
                    <el-form-item label="出生年次 (法定起支年齡)">
                        <el-input :value="birthYearDisplay" disabled style="width: 100%">
                            <template #suffix>
                                <span style="color: var(--el-text-color-secondary)">法定: {{ statutoryAge }} 歲</span>
                            </template>
                        </el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12" :xs="24">
                    <el-form-item label="最高 60 個月平均投保薪資">
                        <el-input-number v-model="laborInsuranceData.averageMonthlySalary" :min="0" :max="45800"
                            :step="1000" style="width: 100%" @change="handleSalaryCheck" />
                    </el-form-item>
                </el-col>

                <el-col :span="12" :xs="24">
                    <el-form-item label="預計開始請領年齡">
                        <el-input-number v-model="laborInsuranceData.expectedClaimAge" :min="minValidClaimAge"
                            :max="80" style="width: 100%" @change="handleClaimAgeChange" />
                    </el-form-item>
                </el-col>

                <el-col :span="12" :xs="24">
                    <el-form-item label="請領時預估餘命 (可手動調整)">
                        <el-input-number v-model="laborInsuranceData.predictedRemainingLife" :min="0" :max="100"
                            :step="0.1" :precision="1" style="width: 100%">
                            <template #suffix>
                                <span>年</span>
                            </template>
                        </el-input-number>
                    </el-form-item>
                </el-col>

                <el-col :span="12" :xs="24">
                    <el-form-item label="目前已累積保險年資">
                        <el-input-number v-model="laborInsuranceData.insuranceSeniority" :min="0" :max="720"
                            placeholder="輸入已累積月數" style="width: 100%">
                            <template #suffix>月</template>
                        </el-input-number>
                    </el-form-item>
                </el-col>
                <el-col :span="12" :xs="24">
                    <el-form-item label="退休時總預估年資 (自動加計)">
                        <el-input :value="(totalProjectedSeniorityInYears).toFixed(1)" disabled style="width: 100%">
                            <template #suffix>年</template>
                        </el-input>
                    </el-form-item>
                </el-col>

            </el-row>

            <el-divider>試算結果 (PV分析)</el-divider>

            <el-row :gutter="20">
                <el-col :span="12" :xs="24">
                    <el-form-item label="預估每月領取金額 (擇優)">
                        <el-input :value="formatMoney(result.bestAmount)" disabled style="width: 100%">
                            <template #suffix>元</template>
                        </el-input>
                    </el-form-item>
                </el-col>

                <el-col :span="12" :xs="24">
                    <el-form-item label="終身總現值 (折現3%)" v-loading="isLifeExpectancyLoading">
                        <el-input :value="formatMoney(stableLifetimePV)" disabled style="width: 100%">
                            <template #suffix>
                                <span>元</span>
                            </template>
                        </el-input>
                    </el-form-item>
                </el-col>

                <el-col :span="24">
                    <el-form-item label="狀態判定">
                        <el-input :value="result.msg" disabled style="width: 100%">
                            <template #prefix>
                                <span
                                    :style="{ color: result.diffYears < 0 ? 'var(--el-color-warning)' : (result.diffYears > 0 ? 'var(--el-color-success)' : 'var(--el-text-color-regular)') }"
                                    style="font-weight: bold; margin-right: 5px;">
                                    ●
                                </span>
                            </template>
                        </el-input>
                    </el-form-item>
                </el-col>
            </el-row>

        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';
import { debounce } from '@/composables/debounce';
import { useLaborInsuranceStore } from '@/stores/laborInsurance';
import { useClientsStore } from '@/stores/clients';
import { useLaborInsuranceAnnuity } from '@/composables/useLaborInsuranceAnnuity';
import { useApi } from '@/composables/useApi';
import { useTVM } from '@/composables/useTVM';

// --- Stores ---
const laborInsuranceStore = useLaborInsuranceStore();
const { data: laborInsuranceData, isLoading } = storeToRefs(laborInsuranceStore);

const clientsStore = useClientsStore();
const { clientList, currentClientId } = storeToRefs(clientsStore);

// --- Composables ---
const { calcPV } = useTVM();
const { authFetch } = useApi();

// --- Local State ---
const isLifeExpectancyLoading = ref(false);
const stableLifetimePV = ref(0);

// --- Client Profile Data ---
const currentClientProfile = computed(() => {
    if (!currentClientId.value || !clientList.value) return null;
    return clientList.value.find(c => c.id === currentClientId.value) || null;
});

const userBirthYear = computed(() => {
    const dateStr = currentClientProfile.value?.birthDate;
    if (!dateStr) return 1970; // Default
    return new Date(dateStr).getFullYear();
});

const birthYearDisplay = computed(() => `${userBirthYear.value} 年 (民國 ${userBirthYear.value - 1911} 年)`);

const currentAge = computed(() => {
    const currentYear = new Date().getFullYear();
    return currentYear - userBirthYear.value;
});

// --- Labor Insurance Calculations ---

const statutoryAge = computed(() => {
    const rocYear = userBirthYear.value - 1911;
    if (rocYear <= 46) return 60;
    if (rocYear === 47) return 61;
    if (rocYear === 48) return 62;
    if (rocYear === 49) return 63;
    if (rocYear === 50) return 64;
    return 65;
});

const minValidClaimAge = computed(() => statutoryAge.value - 5);

const futureWorkYears = computed(() => {
    if (!laborInsuranceData.value) return 0;
    const years = laborInsuranceData.value.expectedClaimAge - currentAge.value;
    return years > 0 ? years : 0;
});

const totalProjectedSeniorityInMonths = computed(() => {
    if (!laborInsuranceData.value) return 0;
    return (laborInsuranceData.value.insuranceSeniority || 0) + (futureWorkYears.value * 12);
});

const totalProjectedSeniorityInYears = computed(() => totalProjectedSeniorityInMonths.value / 12);

const averageMonthlySalaryRef = computed(() => laborInsuranceData.value?.averageMonthlySalary || 0);
const expectedClaimAgeRef = computed(() => laborInsuranceData.value?.expectedClaimAge || 65);

const { result } = useLaborInsuranceAnnuity(
    averageMonthlySalaryRef,
    totalProjectedSeniorityInYears,
    expectedClaimAgeRef,
    statutoryAge
);

function calculateStableLifetimePV() {
    if (!laborInsuranceData.value || result.value.bestAmount <= 0 || !laborInsuranceData.value.predictedRemainingLife) {
        stableLifetimePV.value = 0;
        return;
    }

    // 1. 計算年金在「開始請領時」的現值 (PV at retirement)
    const pvAtRetirement = calcPV(
        0.03 / 12, // 月折現率
        laborInsuranceData.value.predictedRemainingLife * 12, // 總領取期數 (月)
        result.value.bestAmount // monthly payment
    );

    if (pvAtRetirement <= 0) {
        stableLifetimePV.value = 0;
        return;
    }

    // 2. 將「開始請領時」的現值，再折現回「今天」的價值
    const yearsToDiscount = futureWorkYears.value;
    if (yearsToDiscount <= 0) {
        // 如果已經或超過請領年齡，則不需再折現
        stableLifetimePV.value = Math.round(pvAtRetirement);
        return;
    }

    const annualDiscountRate = 0.03;
    const pvToday = pvAtRetirement / Math.pow(1 + annualDiscountRate, yearsToDiscount);

    stableLifetimePV.value = Math.round(pvToday);
}

// Watch for changes in dependencies to recalculate the Present Value.
// This replaces the previous `computed` property for `stableLifetimePV`.
watch(
    () => [result.value.bestAmount, laborInsuranceData.value?.predictedRemainingLife],
    () => {
        // If a life expectancy fetch is in progress, skip calculation.
        // The calculation will be explicitly triggered in the `finally` block of the API call
        // to prevent calculating with stale data and causing the UI value to "jump".
        if (isLifeExpectancyLoading.value) {
            return;
        }
        calculateStableLifetimePV();
    },
    { deep: true }
);

function handleSalaryCheck(value: number | undefined) {
    if (value && value < 45800) {
        ElMessage.warning('提醒：勞保老年給付的平均月投保薪資，是採計加保期間最高60個月之月投保薪資予以平均計算。若此處輸入金額低於最高級距，可能會低估您的給付金額。');
    }
}

function handleClaimAgeChange(newAge: number | undefined, oldAge: number | undefined) {
    // 當使用者變更請領年齡時，觸發此函式
    if (newAge && newAge !== oldAge) {
        // 立即設定讀取狀態，以防止在非同步取得餘命完成前，總現值的 watch 被觸發而使用舊資料計算，造成數值跳動。
        isLifeExpectancyLoading.value = true;
        updatePredictedRemainingLife();
    }
}

function formatMoney(val: number | undefined) {
    if (val === undefined || isNaN(val)) return '0';
    return Math.round(val).toLocaleString();
}

watch(() => result.value.bestAmount, (newVal) => {
    if (laborInsuranceData.value) {
        laborInsuranceData.value.predictedMonthlyAnnuity = newVal;
    }
}, { immediate: true });

async function updatePredictedRemainingLife() {
    if (!laborInsuranceData.value || !currentClientProfile.value) return;

    const claimAge = laborInsuranceData.value.expectedClaimAge;
    if (!claimAge) return;

    const gender = currentClientProfile.value.gender;
    if (!gender) {
        console.warn('Gender not available for life expectancy calculation.');
        return;
    }

    const currentYear = new Date().getFullYear();
    const yearsUntilClaim = claimAge - currentAge.value;
    const claimYear = currentYear + (yearsUntilClaim > 0 ? yearsUntilClaim : 0);

    try {
        const res = await authFetch(`/api/v1/metadata/life-expectancy?year=${claimYear}&gender=${gender}&age=${claimAge}`);
        if (res.ok) {
            const data = await res.json();
            if (laborInsuranceData.value && data && typeof data.expectedLifespan === 'number') {
                laborInsuranceData.value.predictedRemainingLife = data.expectedLifespan;
            }
        } else {
            console.error(`Failed to fetch life expectancy. Status: ${res.status}`);
        }
    } catch (error) {
        console.error('Error fetching life expectancy:', error);
    } finally {
        isLifeExpectancyLoading.value = false;
        // Explicitly trigger calculation after API call finishes to ensure the correct value is computed
        // with the latest life expectancy and annuity amount, preventing UI jumps.
        calculateStableLifetimePV();
    }
}

const performSave = async () => {
    try {
        await laborInsuranceStore.saveLaborInsuranceData();
    } catch (error) { /* Error is handled in the store */ }
};

const debouncedSave = debounce(performSave, 800);

watch(laborInsuranceData, (newVal) => {
    if (newVal) debouncedSave();
}, { deep: true });
</script>