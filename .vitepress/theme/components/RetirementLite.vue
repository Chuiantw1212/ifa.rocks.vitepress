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
                    <el-tag type="primary" effect="dark" round>IFA 核心輸入</el-tag>
                </el-row>
            </template>

            <el-form label-position="top">
                <el-row :gutter="20">
                    <el-col :span="8" :xs="24">
                        <el-form-item label="目前年齡">
                            <el-input-number v-model="currentAge" :controls="false" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8" :xs="24">
                        <el-form-item label="預計退休年齡">
                            <el-input-number v-model="retireAge" :controls="false" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8" :xs="24">
                        <el-form-item label="預估壽命">
                            <el-input-number v-model="lifeExpectancy" :controls="false" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="8" :xs="24">
                        <el-form-item label="現在每月體感開支 (元)">
                            <el-input-number v-model="currentExpense" :controls="false" :step="5000"
                                style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8" :xs="24">
                        <el-form-item label="預估通膨率 (%)">
                            <el-input-number v-model="inflationRate" :precision="1" :controls="false"
                                style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8" :xs="24">
                        <el-form-item label="預期投資報酬率 (%)">
                            <el-input-number v-model="returnRate" :precision="1" :controls="false"
                                style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </el-card>

        <el-card shadow="hover" class="step-fv">
            <el-row :gutter="40" align="middle">
                <el-col :span="10" :xs="24">
                    <el-text size="large" strong tag="div">步驟一：計算通膨後的實質開支</el-text>
                    <el-divider border-style="none" />
                    <el-descriptions :column="1" border size="small">
                        <el-descriptions-item label="計算目標">FV (未來終值)</el-descriptions-item>
                        <el-descriptions-item label="N (成長年數)">{{ yearsToRetire }} 年</el-descriptions-item>
                        <el-descriptions-item label="I/Y (預估通膨)">{{ inflationRate }} %</el-descriptions-item>
                        <el-descriptions-item label="PV (今日開支)">$ {{ currentExpense.toLocaleString()
                            }}</el-descriptions-item>
                    </el-descriptions>
                </el-col>
                <el-col :span="14" :xs="24">
                    <el-text type="info" tag="div">退休首月所需生活費</el-text>
                    <el-statistic :value="futureExpense" :precision="0" group-separator="," />
                    <el-text size="small" type="info">
                        考慮通膨後，{{ yearsToRetire }} 年後的購買力對等金額
                    </el-text>
                </el-col>
            </el-row>
        </el-card>

        <el-card shadow="hover" class="step-pv">
            <el-row :gutter="40" align="middle">
                <el-col :span="10" :xs="24">
                    <el-text size="large" strong tag="div">步驟二：計算所需退休金總額</el-text>
                    <el-divider border-style="none" />
                    <el-descriptions :column="1" border size="small">
                        <el-descriptions-item label="計算目標">PV (退休時點現值)</el-descriptions-item>
                        <el-descriptions-item label="N (提領月數)">{{ (lifeExpectancy - retireAge) * 12 }}
                            個月</el-descriptions-item>
                        <el-descriptions-item label="I/Y (實質月投報)">{{ (realReturnRate / 12).toFixed(3) }}
                            %</el-descriptions-item>
                        <el-descriptions-item label="PMT (預計月領)">$ {{ Math.round(futureExpense).toLocaleString()
                            }}</el-descriptions-item>
                    </el-descriptions>
                </el-col>
                <el-col :span="14" :xs="24">
                    <el-text type="info" tag="div">應備退休總金庫 (目標值)</el-text>
                    <el-statistic :value="targetCorpus" :precision="0" group-separator="," />
                    <el-text size="small" type="info">
                        以 {{ realReturnRate.toFixed(1) }}% 實質回報支撐至 {{ lifeExpectancy }} 歲
                    </el-text>
                </el-col>
            </el-row>
        </el-card>

        <el-card shadow="hover" class="step-pmt">
            <el-row :gutter="40" align="middle">
                <el-col :span="10" :xs="24">
                    <el-text size="large" strong tag="div">步驟三：倒推現在每月儲蓄</el-text>
                    <el-divider border-style="none" />
                    <el-descriptions :column="1" border size="small">
                        <el-descriptions-item label="計算目標">PMT (每月儲蓄額)</el-descriptions-item>
                        <el-descriptions-item label="N (準備月數)">{{ yearsToRetire * 12 }} 個月</el-descriptions-item>
                        <el-descriptions-item label="I/Y (預期月投報)">{{ (returnRate / 12).toFixed(3) }}
                            %</el-descriptions-item>
                        <el-descriptions-item label="FV (目標總金庫)">$ {{ Math.round(targetCorpus).toLocaleString()
                            }}</el-descriptions-item>
                    </el-descriptions>
                </el-col>
                <el-col :span="14" :xs="24">
                    <el-text type="danger" strong tag="div">建議每月投資金額</el-text>
                    <el-statistic :value="requiredSaving" :precision="0" group-separator=","
                        value-style="color: var(--el-color-danger); font-size: 2.5rem; font-weight: 800;" />
                    <el-text size="small" type="danger">
                        從現在起至 {{ retireAge }} 歲，每月須投入市場之金額
                    </el-text>
                </el-col>
            </el-row>
        </el-card>

    </el-space>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import { useTVM } from '../composables/useTVM'

const currentAge = ref(38)
const retireAge = ref(45)
const lifeExpectancy = ref(90)
const currentExpense = ref(150000)
const inflationRate = ref(3)
const returnRate = ref(8)

const { calcFV, calcPV, calcPMT } = useTVM()

const realReturnRate = computed(() => {
    const real = returnRate.value - inflationRate.value
    return real > 0 ? real : 0
})

const yearsToRetire = computed(() => retireAge.value - currentAge.value)

const futureExpense = computed(() => {
    return calcFV(inflationRate.value / 100, yearsToRetire.value, 0, currentExpense.value)
})

const targetCorpus = computed(() => {
    const monthsInRetirement = (lifeExpectancy.value - retireAge.value) * 12
    const monthlyRealRate = realReturnRate.value / 100 / 12
    return calcPV(monthlyRealRate, monthsInRetirement, futureExpense.value)
})

const requiredSaving = computed(() => {
    const monthsToSave = yearsToRetire.value * 12
    const monthlyReturnRate = returnRate.value / 100 / 12
    return calcPMT(monthlyReturnRate, monthsToSave, targetCorpus.value)
})
</script>