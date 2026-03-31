<template>
    <div class="calculator">
        <el-card class="calculator__card">
            <template #header>
                基本資料
            </template>
            <el-form>
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="目前年齡">
                            <el-input-number v-model="profile.age" :min="0" :max="120" Ｆ @change="onProfileChanged()">
                                <template #suffix>
                                    歲
                                </template>
                            </el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="無風險利率">
                            <el-input-number v-model="config.riskFreeRatePerYear" :min="0" :max="100" :step="0.125"
                                @change="updateAllCharts()">
                                <template #suffix>
                                    %
                                </template>
                            </el-input-number>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-divider content-position="left">退休</el-divider>
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="預計退休">
                            <el-input-number v-model="retirement.age" :min="50" :max="70" Ｆ
                                @change="onReqirementChanged()">
                                <template #suffix>
                                    歲
                                </template>
                            </el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="退休後餘命">
                            <el-input-number v-model="retirement.lifeExpectancy" :min="0" :max="120" Ｆ
                                @change="onReqirementChanged()">
                                <template #suffix>
                                    年
                                </template>
                            </el-input-number>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-divider content-position="left">生息資產</el-divider>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="現有資產">
                            <el-input v-model="security.presentValue" :min="0" :step="100000" @change="onAssetChanged()"
                                :formatter="formatMoney" :parser="parseMoney"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="投資報酬率">
                            <el-input-number v-model="security.presentIrr" :min="0" :max="100" :step="0.1"
                                @change="onAssetChanged()">
                                <template #suffix>
                                    %
                                </template>
                            </el-input-number>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </el-card>

        <el-card class="calculator__card">
            <el-table class="card__table" :data="financeGoals">
                <el-table-column prop="name" label="理財目標" width="140">
                    <template #default="scope">
                        <el-input v-model="scope.row.name"
                            :disabled="['理財&其他收入', '在職期間收入', '在職期間支出', '退休後收入', '退休後支出'].includes(scope.row.name)"
                            placeholder="請輸入" @change="updateAllCharts()">
                        </el-input>
                    </template>
                </el-table-column>
                <el-table-column prop="startAge" label="開始年齡" width="200">
                    <template #default="scope">
                        <el-input-number v-model="scope.row.startAge"
                            :disabled="['理財&其他收入', '在職期間收入', '在職期間支出', '退休後收入', '退休後支出'].includes(scope.row.name)"
                            @change="updateAllCharts()">
                            <template #suffix>
                                歲
                            </template>
                        </el-input-number>
                    </template>
                </el-table-column>
                <el-table-column prop="pmt" label="現金流" width="140">
                    <template #default="scope">
                        <el-input v-model="scope.row.pmt" :step="10000" @change="updateAllCharts()"
                            :formatter="formatMoney" :parser="parseMoney"></el-input>
                    </template>
                </el-table-column>
                <el-table-column prop="n" label="持續年期" width="200">
                    <template #default="scope">
                        <el-input-number v-model="scope.row.n"
                            :disabled="['理財&其他收入', '在職期間收入', '退休後收入', '退休後支出', '購房首付'].includes('')"
                            @change="updateAllCharts()">
                            <template #suffix>
                                年
                            </template>
                        </el-input-number>
                    </template>
                </el-table-column>
                <el-table-column prop="ratePerYear" label="現金流增長率" width="200">
                    <template #default="scope">
                        <el-input-number v-model="scope.row.ratePerYear" @change="updateAllCharts()">
                            <template #suffix>
                                %
                            </template>
                        </el-input-number>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-card class="calculator__card">
            <template #header>
                現金流量表
            </template>
            <el-row justify="center">
                <canvas class="calculator__chart" id="cashFlowChart"></canvas>
            </el-row>
        </el-card>

        <el-card class="calculator__card">
            <template #header>
                不同報酬率 / 資產變化比較表
            </template>
            <el-row justify="center">
                <canvas class="calculator__chart" id="assetChart"></canvas>
            </el-row>
        </el-card>

        <el-card class="calculator__card">
            <template #header>
                試算結果
            </template>
            <el-form-item label="所需報酬率">
                <el-input-number v-model="security.expectedIrr" :disabled="true">
                    <template #suffix>
                        %
                    </template>
                </el-input-number>
            </el-form-item>
            <template #footer>
                <el-button @click="exportAsPdf()">
                    匯出
                </el-button>
            </template>
        </el-card>
    </div>
</template>
<script lang="ts" setup>
import Chart, { type TooltipItem } from 'chart.js/auto';
import { irr } from 'financial'
import html2canvas from 'html2canvas';
import { jsPDF } from "jspdf";
import { onMounted, ref, shallowRef } from 'vue';

const config = ref({
    riskFreeRatePerYear: 2,
})

const profile = ref({
    age: 34,
})

// const career = ref({
//     postTaxMonthlyIncome: 60000,
//     growthRate: 2,
// })

const retirement = ref({
    age: 70,
    income: 42000,
    lifeExpectancy: 18,
})

const security = ref({
    presentValue: 6000000,
    presentIrr: 5,
    expectedIrr: 0,
})

// goals
const financeGoals = ref([
    // 流入
    {
        name: '理財&其他收入',
        startAge: 0,
        pmt: 200000,
        n: 0,
        ratePerYear: 2,
    },
    {
        name: '在職期間收入',
        startAge: 0,
        pmt: 200000,
        n: 0,
        ratePerYear: 2,
    },
    {
        name: '在職期間支出',
        startAge: 0,
        pmt: -360000,
        n: 0,
        ratePerYear: 2,
    },
    {
        name: '退休後收入',
        startAge: 0,
        pmt: 300000,
        n: 0,
        ratePerYear: 2,
    },
    // 流出
    {
        name: '退休後支出',
        startAge: 0,
        pmt: -360000,
        n: 0,
        ratePerYear: 2,
    },
    {
        name: '購房貸款',
        startAge: 35,
        pmt: -360000,
        n: 30,
        ratePerYear: 2,
    },
    {
        name: '購房首付',
        startAge: 35,
        pmt: -3000000,
        n: 1,
        ratePerYear: 2,
    },
])

interface IDatasets {
    label: string,
    ratePerYear?: number,
    data: number[],
    stacked: boolean,
    fill: boolean,
}

const cashflowDatasets = ref<IDatasets[]>([])
const netCashflows = ref<number[]>([])

// methods
function onProfileChanged() {
    const workingPeriod = retirement.value.age - profile.value.age

    const financeIncome = financeGoals.value.find(item => {
        return item.name === '理財&其他收入'
    })
    if (financeIncome) {
        financeIncome.startAge = profile.value.age
        financeIncome.n = workingPeriod
    }

    const careerIncome = financeGoals.value.find(item => {
        return item.name === '在職期間收入'
    })
    if (careerIncome) {
        careerIncome.startAge = profile.value.age
        careerIncome.n = workingPeriod
    }

    const careerExpense = financeGoals.value.find(item => {
        return item.name === '在職期間支出'
    })
    if (careerExpense) {
        careerExpense.startAge = profile.value.age
        careerExpense.n = workingPeriod
    }

    updateAllCharts()
}

function onReqirementChanged() {
    const date = new Date()
    let currentYear = date.getFullYear()
    currentYear += retirement.value.lifeExpectancy
    date.setFullYear(currentYear)

    const retirementIncome = financeGoals.value.find(item => {
        return item.name === '退休後收入'
    })
    if (retirementIncome) {
        retirementIncome.startAge = retirement.value.age
        retirementIncome.n = retirement.value.lifeExpectancy
    }

    const retirementExpense = financeGoals.value.find(item => {
        return item.name === '退休後支出'
    })
    if (retirementExpense) {
        retirementExpense.startAge = retirement.value.age
        retirementExpense.n = retirement.value.lifeExpectancy
    }
    updateAllCharts()
}

function onAssetChanged() {
    updateAllCharts()
}

async function updateAllCharts() {
    setTimeout(async () => {
        await drawCashFlowChart()
        await drawAssetChart()
    })
}


let cashFlowChartRef = ref<Chart>()

function drawCashFlowChart() {
    const labels: string[] = []
    const lifeExpectancy = retirement.value.age + retirement.value.lifeExpectancy

    // 計算目標PMT
    const datasets: IDatasets[] = financeGoals.value.map(item => {
        const data = []
        for (let i = 0; i < lifeExpectancy - profile.value.age; i++) {
            const simAge = i + profile.value.age
            labels[i] = `${simAge}歲`
            const isStarted = simAge >= item.startAge
            const isEnded = simAge >= item.startAge + Number(item.n)
            if (isStarted && !isEnded) {
                let itemRatePerYear = 1 + item.ratePerYear / 100
                itemRatePerYear = Math.pow(itemRatePerYear, i)
                const pmt = item.pmt * itemRatePerYear
                data.push(pmt)
            } else {
                data.push(0)
            }
        }

        return {
            label: item.name,
            ratePerYear: item.ratePerYear,
            data,
            stacked: false,
            fill: true,
        }
    })
    // 計算淨現金流
    netCashflows.value = datasets.reduce((accumulator: number[], currentValue) => {
        const sum: number[] = accumulator
        const data = currentValue.data
        data.forEach((number, index) => {
            const pmt = number
            if (sum[index]) {
                sum[index] += pmt
            } else {
                sum[index] = pmt
            }
        })
        return sum as number[]
    }, [])
    cashflowDatasets.value = datasets

    // // 驗證淨現金流 
    // const netCashflowDataset = {
    //     label: '淨現金流',
    //     data: netCashflows.value,
    //     stacked: true,
    //     fill: true,
    // }
    // labels.push('淨現金流')
    // cashflowDatasets.value.push(netCashflowDataset)

    // 繪圖
    const chartData = {
        datasets: cashflowDatasets.value,
        labels,
    }
    if (cashFlowChartRef.value) {
        cashFlowChartRef.value.data = chartData
        cashFlowChartRef.value.update()
    } else {
        const ctx: any = document.getElementById('cashFlowChart')
        const chartInstance = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: formatToolTip
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '年齡'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '現金流'
                        }
                    }
                }
            },
        })
        cashFlowChartRef = shallowRef(chartInstance)
    }
}

let assetChartRef = ref<Chart>()

function drawAssetChart() {
    let canvas = null
    if (assetChartRef.value) {
        canvas = assetChartRef.value.canvas
    }

    const { riskFreeRatePerYear } = config.value
    const lifeExpectancy = retirement.value.age + retirement.value.lifeExpectancy
    const n = lifeExpectancy - profile.value.age
    const labels: string[] = []
    for (let i = 0; i < n; i++) {
        labels.push(`${profile.value.age + i}歲`)
    }

    // 無風險利率 
    const riskFreeData: number[] = calculateAssetData({
        n: n,
        rate: riskFreeRatePerYear / 100,
        pv: Number(security.value.presentValue),
        cashflows: netCashflows.value,
        noNegative: true,
    })

    // 目前投資報酬率
    const currentReturnData: number[] = calculateAssetData({
        n: lifeExpectancy - profile.value.age,
        rate: security.value.presentIrr / 100,
        pv: Number(security.value.presentValue),
        cashflows: netCashflows.value,
        noNegative: true,
    })


    /** 理想投資報酬率 */
    // 計算每期淨現金流
    const completeCashflows = [Number(security.value.presentValue), ...netCashflows.value]
    let initialCashflows = completeCashflows
    let expectedIrr: number = irr(initialCashflows)
    expectedIrr = Math.round(expectedIrr * 1000) / 1000;

    if (isNaN(expectedIrr)) {
        // 完全不夠
        expectedIrr = 0
    }
    if (Math.abs(expectedIrr) === Infinity) {
        // 完全夠
        expectedIrr = 0
    }

    // 暴力破解期望IRR
    let requiredReturnData: number[] = []
    requiredReturnData = calculateAssetData({
        n: lifeExpectancy - profile.value.age,
        rate: expectedIrr,
        pv: Number(security.value.presentValue),
        cashflows: netCashflows.value,
        noNegative: true,
    })

    // 暴力破解避免暫時性的負資產
    if (!isNaN(expectedIrr) && Math.abs(expectedIrr) !== Infinity) {
        while (requiredReturnData.length < n - 1) {
            expectedIrr += 0.001
            requiredReturnData = calculateAssetData({
                n: lifeExpectancy - profile.value.age,
                rate: expectedIrr,
                pv: Number(security.value.presentValue),
                cashflows: netCashflows.value,
                noNegative: true,
            })
        }
    }
    security.value.expectedIrr = Number(Number(expectedIrr * 100).toFixed(2))

    // 資料集
    const datasets = [
        {
            label: '無風險利率',
            data: riskFreeData,
            fill: true,
        },
        {
            label: '現有投資率',
            data: currentReturnData,
            fill: true,
        },
        {
            label: '所需報酬率',
            data: requiredReturnData,
            fill: true,
        },
    ]

    const chartData = {
        datasets,
        labels,
    }

    // 繪圖
    if (assetChartRef.value) {
        assetChartRef.value.data = chartData
        assetChartRef.value.update()
    } else {
        const ctx: any = document.getElementById('assetChart')
        const chartInstance = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: formatToolTip
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '年齡'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '資產變化'
                        }
                    }
                }
            },
        })
        assetChartRef = shallowRef(chartInstance)
    }
}

function formatToolTip(tooltipItems: TooltipItem<any>) {
    const { raw, dataset, } = tooltipItems
    const { label } = dataset
    const formatNumber = Math.round(raw as number / 10000)
    const formatString = formatNumber.toLocaleString()
    return `${label}:${formatString}萬`
}

async function exportAsPdf() {
    print()
}

function calculateAssetData(payload: { n: number, rate: number, pv: number, cashflows: number[], noNegative?: boolean }) {
    const n = payload.n
    const rate = payload.rate
    const cashflows = payload.cashflows
    const data = []
    const noNegative = payload.noNegative ?? false
    let pv = Number(payload.pv)
    let fv = 0
    for (let i = 0; i < n; i++) {
        // 計算pv
        pv *= (1 + rate)
        // 計算pmt
        pv += cashflows[i]
        // 計算並記錄fv
        fv = pv
        data.push(fv)
        if (noNegative && fv < 0) {
            return data
        }
        // 更新並回存pv
        pv = fv
    }
    return data
}

function formatMoney(value: string) {
    return `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function parseMoney(value: string) {
    return value.replace(/\$\s?|(,*)/g, '')
}

onMounted(() => {
    if (window.origin === 'http://localhost:3000') {

    }
    onProfileChanged()
    onReqirementChanged()
    updateAllCharts()
})

</script>
<style lang="scss" scoped>
.calculator {
    font-family: "Noto Sans TC", serif;
    margin: auto;
}

.calculator {
    .calculator__card {
        page-break-after: always;
        width: 100%;
        margin-bottom: 11px;

        .card__table {
            margin: auto;
            width: fit-content;
        }
    }
}

@media print {
    @page {
        size: A4 landscape;
    }
}
</style>