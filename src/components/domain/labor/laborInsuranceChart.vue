<template>
    <el-card shadow="never" v-loading="isRangeLoading">
        <template #header>
            <div class="card-header">
                <span>終身總現值與請領年齡關係圖</span>
            </div>
        </template>
        <div class="chart-container">
            <canvas ref="canvasRef"></canvas>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, watch, computed } from 'vue';
import Chart from 'chart.js/auto';
import type { ChartData, ChartOptions, ChartType, DefaultDataPoint, TooltipItem } from 'chart.js';
import { storeToRefs } from 'pinia';
import { useLaborInsuranceStore } from '@/stores/laborInsurance';
import { useTVM } from '@/composables/useTVM';
import { useClientsStore } from '@/stores/clients';

interface DataPoint {
    age: number;
    value: number;
    seniority: number;
    lifeExpectancy: number | undefined;
}

declare module 'chart.js' {
    interface ChartDatasetProperties<TType extends ChartType = ChartType, TData = DefaultDataPoint<TType>> {
        pvAtStatutoryAge?: number;
        fullDataPoints?: DataPoint[];
    }
}

// --- Stores ---
const laborInsuranceStore = useLaborInsuranceStore();
// `lifeExpectancyRange` and `isRangeLoading` are now read from the central store.
const { data: laborInsuranceData, lifeExpectancyRange, isRangeLoading } = storeToRefs(laborInsuranceStore);

const clientsStore = useClientsStore();
const { clientList, currentClientId } = storeToRefs(clientsStore);

// --- Chart ---
const canvasRef = ref<HTMLCanvasElement | null>(null);
const chartInstance = shallowRef<Chart<'bar'> | null>(null);

// --- Composables ---
const { calcPV } = useTVM();

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

/**
 * 獨立計算函式，用於根據指定年齡計算勞保年金。
 * 此計算邏輯基於 useLaborInsuranceAnnuity composable。
 */
function calculateAnnuityForAge(
    avgSalary: number,
    seniority: number,
    claimAge: number,
    baseStatutoryAge: number
): number {
    if (!avgSalary || seniority < 15) {
        return 0;
    }

    const formulaA = avgSalary * seniority * 0.00775 + 3000;
    const formulaB = avgSalary * seniority * 0.0155;
    const baseAmount = Math.max(formulaA, formulaB);

    const diffYears = claimAge - baseStatutoryAge;
    const rateAdjustment = diffYears * 0.04; // 每提前/延後一年，減/增給 4%
    const finalAdjustment = Math.max(-0.2, Math.min(0.2, rateAdjustment)); // 上下限為 20%

    return Math.round(baseAmount * (1 + finalAdjustment));
}

const chartData = computed<ChartData<'bar'>>(() => {
    if (!laborInsuranceData.value) {
        return { labels: [], datasets: [] };
    }

    const startAge = statutoryAge.value - 5;
    const endAge = statutoryAge.value + 5;
    const selectedAge = laborInsuranceData.value.expectedClaimAge;
    const avgSalary = laborInsuranceData.value.averageMonthlySalary || 0;
    const currentSeniorityMonths = laborInsuranceData.value.insuranceSeniority || 0;

    // 1. 計算每個年齡對應的數據點
    const dataPoints: DataPoint[] = [];
    for (let age = startAge; age <= endAge; age++) {
        const futureWorkYearsForChart = age - currentAge.value > 0 ? age - currentAge.value : 0;
        const totalSeniorityMonths = currentSeniorityMonths + (futureWorkYearsForChart * 12);
        const seniorityForChart = totalSeniorityMonths / 12;

        const annuityAmount = calculateAnnuityForAge(avgSalary, seniorityForChart, age, statutoryAge.value);

        // 從 API 回傳的陣列中找到對應年齡的預估餘命
        const lifeExpectancyForAge = lifeExpectancyRange.value.find(item => item.age === age)?.expectedLifespan;

        // 如果找不到對應的餘命資料 (例如 API 正在載入或失敗)，則不計算此數據點的值
        if (lifeExpectancyForAge === undefined) {
            dataPoints.push({
                age,
                value: 0,
                seniority: seniorityForChart,
                lifeExpectancy: undefined
            });
            continue;
        }

        const numberOfMonthsToReceive = lifeExpectancyForAge * 12;

        const pvAtRetirement = calcPV(
            0.03 / 12, // 月折現率
            numberOfMonthsToReceive, // 總領取期數 (月)
            annuityAmount // 該年齡對應的每月年金
        );

        let pvToday = pvAtRetirement;
        if (futureWorkYearsForChart > 0 && pvAtRetirement > 0) {
            pvToday = pvAtRetirement / Math.pow(1 + 0.03, futureWorkYearsForChart);
        }
        dataPoints.push({
            age,
            value: Math.round(pvToday),
            seniority: seniorityForChart,
            lifeExpectancy: lifeExpectancyForAge
        });
    }

    // 2. 找到法定年齡的總現值作為比較基準
    const pvAtStatutoryAge = dataPoints.find(p => p.age === statutoryAge.value)?.value || 0;

    // 3. 準備 Chart.js 所需的格式
    const labels = dataPoints.map(p => `${p.age} 歲`);
    const data = dataPoints.map(p => p.value);
    const backgroundColors = dataPoints.map(p => {
        if (p.age === selectedAge) return 'rgba(233, 174, 43, 0.8)'; // 當前選擇: 橘色
        if (p.age === statutoryAge.value) return 'rgba(64, 158, 255, 0.8)'; // 法定年齡: 藍色
        return 'rgba(144, 147, 153, 0.5)'; // 其他: 灰色
    });

    return {
        labels,
        datasets: [{
            label: '終身總現值 (折現3%)',
            data,
            backgroundColor: backgroundColors,
            pvAtStatutoryAge: pvAtStatutoryAge, // 自定義屬性，用於 tooltip 比較
            fullDataPoints: dataPoints
        }]
    };
});

const renderChart = () => {
    if (!canvasRef.value) return;
    const options: ChartOptions<'bar'> = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (c: TooltipItem<'bar'>) => ` ${c.dataset.label}: ${Math.round(c.parsed.y || 0).toLocaleString()} 元`,
                    afterLabel: (context) => {
                        const dataset = context.chart.data.datasets[context.datasetIndex];
                        const dataPoint = dataset.fullDataPoints?.[context.dataIndex];

                        if (!dataPoint) return;

                        const newLines: string[] = [];

                        // 新增：顯示預估年資和餘命
                        newLines.push(`  預估年資: ${dataPoint.seniority.toFixed(1)} 年`);
                        if (dataPoint.lifeExpectancy !== undefined) {
                            newLines.push(`  預估餘命: ${dataPoint.lifeExpectancy.toFixed(1)} 年`);
                        }

                        if (context.label === `${statutoryAge.value} 歲`) {
                            newLines.push('  (法定年齡基準)');
                        } else {
                            const pvAtStatutoryAge = dataset.pvAtStatutoryAge;
                            if (pvAtStatutoryAge !== undefined && dataPoint.value > 0) {
                                const diff = (context.parsed.y || 0) - pvAtStatutoryAge;
                                let comparisonString = `與法定年齡相比: ${diff >= 0 ? '+' : '-'} ${Math.abs(Math.round(diff)).toLocaleString()} 元`;

                                if (pvAtStatutoryAge > 0) {
                                    const percentageDiff = ((context.parsed.y || 0) / pvAtStatutoryAge - 1) * 100;
                                    comparisonString += ` (${percentageDiff >= 0 ? '+' : ''}${percentageDiff.toFixed(1)}%)`;
                                }
                                newLines.push(comparisonString);
                            }
                        }
                        return newLines;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (v) => {
                        if (typeof v === 'number') {
                            if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                            if (v >= 1000) return `${Math.round(v / 1000)}K`;
                        }
                        return v;
                    }
                }
            }
        }
    };
    if (chartInstance.value) {
        chartInstance.value.data = chartData.value;
        chartInstance.value.options = options;
        chartInstance.value.update();
    } else {
        chartInstance.value = new Chart(canvasRef.value, { type: 'bar', data: chartData.value, options });
    }
};

watch(chartData, renderChart, { deep: true });
onMounted(renderChart);
</script>

<style scoped>
.chart-container {
    height: 300px;
    position: relative;
}
</style>