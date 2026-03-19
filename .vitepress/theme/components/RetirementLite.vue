<template>
    <el-space direction="vertical" fill :size="24" style="width: 100%">

        <el-card shadow="always">
            <template #header>
                <el-row justify="space-between" align="middle">
                    <el-space>
                        <el-icon>
                            <Setting />
                        </el-icon>
                        <el-text size="large" strong>退休基本參數設定</el-text>
                    </el-space>
                </el-row>
            </template>

            <el-form label-position="top">
                <el-row :gutter="20">
                    <el-col :span="6" :xs="24">
                        <el-form-item label="目前年齡">
                            <el-input-number v-model="currentAge" :controls="false" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6" :xs="24">
                        <el-form-item label="預計退休年齡">
                            <el-input-number v-model="retireAge" :controls="false" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6" :xs="24">
                        <el-form-item label="預估壽命">
                            <el-input-number v-model="lifeExpectancy" :controls="false" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6" :xs="24">
                        <el-form-item label="預估通膨率 (%)">
                            <el-input-number v-model="inflationRate" :precision="1" :controls="false"
                                style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </el-card>

        <el-card shadow="hover">
            <el-text size="large" strong tag="div">步驟一：計算通膨後的實質開支</el-text>
            <el-divider border-style="none" />

            <el-form label-position="top">
                <el-row>
                    <el-col :span="8" :xs="24">
                        <el-form-item label="現在每月體感開支 (元)">
                            <el-input-number v-model="currentExpense" :controls="false" :step="5000"
                                style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <el-descriptions :column="4" border size="small" direction="vertical">
                <el-descriptions-item label="N (成長年數)">{{ yearsToRetire }} 年</el-descriptions-item>
                <el-descriptions-item label="I/Y (年通膨率)">{{ inflationRate }} %</el-descriptions-item>
                <el-descriptions-item label="PV (今日開支)">$ {{ currentExpense.toLocaleString() }}</el-descriptions-item>
                <el-descriptions-item label="PMT (年金)">$ 0</el-descriptions-item>
            </el-descriptions>

            <el-divider />

            <el-row justify="space-between" align="bottom">
                <el-col :span="12">
                    <el-text type="info" tag="div">退休後第一個月月開支 (FV)</el-text>
                    <el-statistic :value="futureExpense" :precision="0" group-separator="," />
                </el-col>
                <el-col :span="12" style="text-align: right">
                    <el-text size="small" type="info">
                        考慮年通膨率 {{ inflationRate }}%，{{ yearsToRetire }} 年後的對等金額
                    </el-text>
                </el-col>
            </el-row>
        </el-card>

        <el-card shadow="hover">
            <el-text size="large" strong tag="div">步驟二：計算退休應備金總額</el-text>
            <el-divider border-style="none" />

            <el-form label-position="top">
                <el-row>
                    <el-col :span="8" :xs="24">
                        <el-form-item label="退休後資產報酬率 (%)">
                            <el-input-number v-model="postRetireReturnRate" :precision="1" :controls="false"
                                style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <el-descriptions :column="4" border size="small" direction="vertical">
                <el-descriptions-item label="N (提領月數)">{{ monthsInRetirement }} 個月</el-descriptions-item>
                <el-descriptions-item label="I/Y (實質月投報)">{{ (monthlyRealRate * 100).toFixed(3) }} %</el-descriptions-item>
                <el-descriptions-item label="PMT (預計月領)">$ {{ Math.round(futureExpense).toLocaleString()
                    }}</el-descriptions-item>
                <el-descriptions-item label="FV (未來終值)">$ 0</el-descriptions-item>
            </el-descriptions>

            <el-divider />

            <el-row justify="space-between" align="bottom">
                <el-col :span="12">
                    <el-text type="info" tag="div">應備退休總金庫 (PV)</el-text>
                    <el-statistic :value="targetCorpus" :precision="0" group-separator="," />
                </el-col>
                <el-col :span="12" style="text-align: right">
                    <el-text size="small" type="info">資產預計於 {{ lifeExpectancy }} 歲時剛好花完 (FV=0)</el-text>
                </el-col>
            </el-row>
        </el-card>

        <el-card shadow="hover">
            <el-text size="large" strong tag="div">步驟三：倒推現在每月儲蓄</el-text>
            <el-divider border-style="none" />

            <el-form label-position="top">
                <el-row :gutter="20">
                    <el-col :span="8" :xs="24">
                        <el-form-item label="目前已備資產 (元)">
                            <el-input-number v-model="existingAssets" :controls="false" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8" :xs="24">
                        <el-form-item label="退休前報酬率 (%)">
                            <el-input-number v-model="preRetireReturnRate" :precision="1" :controls="false"
                                style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <el-descriptions :column="4" border size="small" direction="vertical">
                <el-descriptions-item label="N (準備月數)">{{ monthsToRetire }} 個月</el-descriptions-item>
                <el-descriptions-item label="I/Y (月投報率)">{{ (monthlyPreRetireReturnRate * 100).toFixed(3) }} %</el-descriptions-item>
                <el-descriptions-item label="PV (現有資產)">$ {{ existingAssets.toLocaleString() }}</el-descriptions-item>
                <el-descriptions-item label="FV (目標金庫)">$ {{ Math.round(targetCorpus).toLocaleString()
                    }}</el-descriptions-item>
            </el-descriptions>

            <el-divider />

            <el-row justify="space-between" align="bottom">
                <el-col :span="12">
                    <el-text type="danger" strong tag="div">建議每月應存金額 (PMT)</el-text>
                    <el-statistic :value="requiredSaving" :precision="0" group-separator=","
                        value-style="color: var(--el-color-danger);" />
                </el-col>
                <el-col :span="12" style="text-align: right">
                    <el-text size="small" type="danger">從現在起至退休前，每月須投入市場之金額</el-text>
                </el-col>
            </el-row>
        </el-card>

        <el-card shadow="always">
            <template #header>
                <el-row justify="space-between" align="middle">
                    <el-space>
                        <el-icon>
                            <DataLine />
                        </el-icon>
                        <el-text size="large" strong>終身資產模擬曲線</el-text>
                    </el-space>
                </el-row>
            </template>
            <div style="height: 400px">
                <AssetCurveChart v-if="assetCurveData.labels.length" :chart-data="assetCurveData" />
            </div>
        </el-card>
    </el-space>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Setting, DataLine } from '@element-plus/icons-vue'
import { useTVM } from '../composables/useTVM'

// 參數預設值
const currentAge = ref(35)
const retireAge = ref(67)
const lifeExpectancy = ref(85)
const inflationRate = ref(3)

const currentExpense = ref(40000)
const postRetireReturnRate = ref(4.5)
const preRetireReturnRate = ref(8)
const existingAssets = ref(450000)

import AssetCurveChart from '../charts/AssetCurveChart.vue'
const { calcFV, calcPV, calcPMT } = useTVM()

// 輔助計算
const yearsToRetire = computed(() => retireAge.value - currentAge.value)
const yearsInRetirement = computed(() => lifeExpectancy.value - retireAge.value)
const monthsToRetire = computed(() => yearsToRetire.value * 12)
const monthsInRetirement = computed(() => yearsInRetirement.value * 12)

const monthlyInflationRate = computed(() => (1 + inflationRate.value / 100) ** (1 / 12) - 1)
const monthlyPreRetireReturnRate = computed(() => (1 + preRetireReturnRate.value / 100) ** (1 / 12) - 1)
const monthlyPostRetireReturnRate = computed(() => (1 + postRetireReturnRate.value / 100) ** (1 / 12) - 1)

const monthlyRealRate = computed(() => {
    return ((1 + monthlyPostRetireReturnRate.value) / (1 + monthlyInflationRate.value)) - 1
})

// 步驟一結果：FV
const futureExpense = computed(() => {
    return calcFV(monthlyInflationRate.value, monthsToRetire.value, 0, currentExpense.value)
})

// 步驟二結果：PV
const targetCorpus = computed(() => {
    // 使用月實質報酬率和首月提領金額計算退休金總額
    return calcPV(monthlyRealRate.value, monthsInRetirement.value, futureExpense.value)
})

// 步驟三結果：PMT
const requiredSaving = computed(() => {
    // 使用名目月報酬率計算
    const monthlyRate = monthlyPreRetireReturnRate.value;
    const fvOfExisting = calcFV(monthlyRate, monthsToRetire.value, 0, existingAssets.value)
    const gap = targetCorpus.value - fvOfExisting

    // Sinking Fund Formula: PMT = FV * (r / ((1+r)^n - 1))
    if (gap <= 0) return 0;
    if (monthlyRate === 0) return gap / monthsToRetire.value;
    return gap * (monthlyRate / (Math.pow(1 + monthlyRate, monthsToRetire.value) - 1));
})

// 圖表數據
const assetCurveData = computed(() => {
    const labels: number[] = [];
    const accumulationData: (number | null)[] = [];
    const decumulationData: (number | null)[] = [];

    if (yearsToRetire.value < 0 || yearsInRetirement.value < 0) {
        return { labels: [], datasets: [] };
    }

    // --- 累積期 ---
    const monthlySaving = requiredSaving.value
    let assetValue = existingAssets.value;
    for (let y = 0; y <= yearsToRetire.value; y++) {
        const age = currentAge.value + y;
        labels.push(age);
        accumulationData.push(Math.round(assetValue));
        if (y < yearsToRetire.value) {
            for (let m = 0; m < 12; m++) {
                assetValue = assetValue * (1 + monthlyPreRetireReturnRate.value) + monthlySaving;
            }
        }
    }

    // 提領期的起點資產
    let retirementStartAsset = accumulationData[accumulationData.length - 1] as number;

    // 為了讓圖表線條連接，提領期數據的第一點必須是累積期的最後一點
    for (let i = 0; i < yearsToRetire.value; i++) {
        decumulationData.push(null);
    }
    decumulationData.push(retirementStartAsset);

    // --- 提領期 ---
    let monthlyWithdrawal = futureExpense.value;
    for (let y = 1; y <= yearsInRetirement.value; y++) {
        for (let m = 0; m < 12; m++) {
            retirementStartAsset = retirementStartAsset * (1 + monthlyPostRetireReturnRate.value) - monthlyWithdrawal;
            monthlyWithdrawal = monthlyWithdrawal * (1 + monthlyInflationRate.value);
        }
        const age = retireAge.value + y;
        labels.push(age);
        accumulationData.push(null);
        decumulationData.push(Math.round(retirementStartAsset < 0 ? 0 : retirementStartAsset));
    }

    return {
        labels,
        datasets: [
            { label: '資產累積期', backgroundColor: 'rgba(64, 158, 255, 0.2)', borderColor: 'rgba(64, 158, 255, 1)', data: accumulationData, fill: 'origin', tension: 0.4, },
            { label: '資產提領期', backgroundColor: 'rgba(245, 108, 108, 0.2)', borderColor: 'rgba(245, 108, 108, 1)', data: decumulationData, fill: 'origin', tension: 0.4, }
        ]
    };
})
</script>

<style scoped>
:deep(.el-descriptions__table) {
    table-layout: fixed;
}
</style>