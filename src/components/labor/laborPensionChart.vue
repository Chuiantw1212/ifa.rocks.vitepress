<template>
    <el-card shadow="never">
        <template #header>
            <div class="card-header">
                <span>退休金累積預估圖</span>
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
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { storeToRefs } from 'pinia';
import { useLaborPensionStore } from '@/stores/labor';
import { useCareerStore } from '@/stores/career';
import { useClientsStore } from '@/stores/clients';

// --- Stores ---
const laborPensionStore = useLaborPensionStore();
const { data: laborPensionData } = storeToRefs(laborPensionStore);

const careerStore = useCareerStore();
const { data: careerData } = storeToRefs(careerStore);

const clientsStore = useClientsStore();
const { clientList, currentClientId } = storeToRefs(clientsStore);

// --- Chart ---
const canvasRef = ref<HTMLCanvasElement | null>(null);
const chartInstance = shallowRef<Chart<'bar'> | null>(null);

const currentClientProfile = computed(() => {
    if (!currentClientId.value || !clientList.value) return null;
    return clientList.value.find(c => c.clientId === currentClientId.value) || null;
});

// --- Calculations ---
const currentAge = computed(() => {
    const birthDate = currentClientProfile.value?.birthDate;
    if (!birthDate) return 30; // Default age
    const birthYear = new Date(birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
});

const futureWorkYears = computed(() => {
    if (!laborPensionData.value) return 0;
    const years = laborPensionData.value.expectedRetirementAge - currentAge.value;
    return years > 0 ? years : 0;
});

function calculateFvSeries(pv: number, pmt: number, rate: number, nper: number): number[] {
    const series: number[] = [];
    let currentValue = pv;
    if (nper <= 0) return [];

    for (let i = 0; i < nper; i++) {
        currentValue = currentValue * (1 + rate) + pmt;
        series.push(Math.round(currentValue));
    }
    return series;
}

const chartData = computed(() => {
    if (!laborPensionData.value || !careerData.value || futureWorkYears.value <= 0) {
        return { labels: [], datasets: [] };
    }

    const nper = futureWorkYears.value;
    const rate = (laborPensionData.value.retirementRoi || 0) / 100;

    // Employer part
    const employerPV = (laborPensionData.value.employerContribution || 0) + (laborPensionData.value.employerEarnings || 0);
    const employerPMT = (careerData.value.pensionEmployerAmount || 0) * 12; // Annual PMT

    // Personal part
    const personalPV = (laborPensionData.value.personalContribution || 0) + (laborPensionData.value.personalEarnings || 0);
    const personalPMT = (careerData.value.pensionPersonalAmount || 0) * 12; // Annual PMT

    const employerSeries = calculateFvSeries(employerPV, employerPMT, rate, nper);
    const personalSeries = calculateFvSeries(personalPV, personalPMT, rate, nper);

    return {
        labels: Array.from({ length: nper }, (_, i) => `${currentAge.value + i + 1}歲`),
        datasets: [
            {
                label: '個人提撥累積',
                data: personalSeries,
                backgroundColor: 'rgba(75, 192, 192, 0.7)', // Teal
            },
            {
                label: '雇主提撥累積',
                data: employerSeries,
                backgroundColor: 'rgba(64, 158, 255, 0.7)', // Blue
            },
        ]
    };
});

const renderChart = () => {
    if (!canvasRef.value) return;

    const data = chartData.value;

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: (context: TooltipItem<'bar'>) => `${context.dataset.label}: ${Math.round(context.parsed.y).toLocaleString()} 元`,
                    footer: (tooltipItems) => {
                        const sum = tooltipItems.reduce((acc, item) => acc + item.parsed.y, 0);
                        return `總計: ${Math.round(sum).toLocaleString()} 元`;
                    }
                }
            },
            legend: { position: 'bottom' },
        },
        scales: {
            x: { stacked: true },
            y: {
                stacked: true,
                ticks: {
                    callback: (value) => {
                        if (typeof value === 'number') {
                            if (value >= 1000000) return `${value / 1000000}M`;
                            if (value >= 1000) return `${value / 1000}K`;
                        }
                        return value;
                    }
                }
            }
        }
    };

    if (chartInstance.value) {
        chartInstance.value.data = data as ChartData<'bar'>;
        chartInstance.value.update();
    } else {
        chartInstance.value = new Chart(canvasRef.value, {
            type: 'bar',
            data: data as ChartData<'bar'>,
            options: options
        });
    }
};

watch(chartData, renderChart, { deep: true });

onMounted(renderChart);
</script>

<style scoped>
.chart-container {
    height: 400px;
    position: relative;
}
</style>