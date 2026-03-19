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
                <el-descriptions-item label="N (提領月數)">12 個月 × {{ yearsInRetirement }} 年</el-descriptions-item>
                <el-descriptions-item label="I/Y (實質月投報)">({{ postRetireReturnRate }}% - {{ inflationRate }}%) /
                    12</el-descriptions-item>
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
                <el-descriptions-item label="N (準備月數)">12 個月 × {{ yearsToRetire }} 年</el-descriptions-item>
                <el-descriptions-item label="I/Y (月投報)">{{ preRetireReturnRate }} % / 12</el-descriptions-item>
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
    </el-space>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Setting } from '@element-plus/icons-vue'
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

const { calcFV, calcPV, calcPMT } = useTVM()

// 輔助計算
const yearsToRetire = computed(() => retireAge.value - currentAge.value)
const yearsInRetirement = computed(() => lifeExpectancy.value - retireAge.value)
const monthsInRetirement = computed(() => yearsInRetirement.value * 12)

const realReturnRate = computed(() => {
    const real = postRetireReturnRate.value - inflationRate.value
    return real > 0 ? real : 0
})

// 步驟一結果：FV
const futureExpense = computed(() => {
    return calcFV(inflationRate.value / 100, yearsToRetire.value, 0, currentExpense.value)
})

// 步驟二結果：PV
const targetCorpus = computed(() => {
    const monthlyRealRate = realReturnRate.value / 100 / 12
    return calcPV(monthlyRealRate, monthsInRetirement.value, futureExpense.value)
})

// 步驟三結果：PMT
const requiredSaving = computed(() => {
    const monthsToSave = yearsToRetire.value * 12
    const monthlyReturnRate = preRetireReturnRate.value / 100 / 12
    const fvOfExisting = calcFV(monthlyReturnRate, monthsToSave, 0, existingAssets.value)
    const gap = targetCorpus.value - fvOfExisting
    return gap > 0 ? calcPMT(monthlyReturnRate, monthsToSave, gap) : 0
})

// 響應式 el-descriptions 欄位數
const windowWidth = ref(0)

const handleResize = () => {
    windowWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
    handleResize() // 初始載入時執行一次
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})

</script>

<style lang="scss" scoped>
:deep(.el-descriptions__table) {
    table-layout: fixed;
}
</style>