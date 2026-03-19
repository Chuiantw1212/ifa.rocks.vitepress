<template>
    <canvas ref="chartCanvas"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, type PropType } from 'vue'
import {
    Chart as ChartJS,
    type ChartData,
    type ChartOptions,
    LineController,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    type TooltipItem
} from 'chart.js'

ChartJS.register(
    LineController, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
)

const props = defineProps({
    chartData: {
        type: Object as PropType<ChartData<'line'>>,
        required: true
    }
})

const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'index',
    },
    plugins: {
        legend: {
            position: 'top',
        },
        tooltip: {
            callbacks: {
                label: function (context: TooltipItem<'line'>) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += '$ ' + new Intl.NumberFormat('zh-TW').format(context.parsed.y);
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        y: {
            ticks: {
                callback: function (value) {
                    if (typeof value !== 'number') return value;
                    if (Math.abs(value) >= 100000000) {
                        return (value / 100000000) + '億';
                    }
                    if (Math.abs(value) >= 10000) {
                        return (value / 10000) + '萬';
                    }
                    return value;
                }
            },
            title: {
                display: true,
                text: '資產淨值'
            }
        },
        x: {
            title: {
                display: true,
                text: '年齡'
            }
        }
    }
}

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: ChartJS<'line'> | null = null

onMounted(() => {
    if (chartCanvas.value) {
        chartInstance = new ChartJS(chartCanvas.value, {
            type: 'line',
            data: props.chartData,
            options: chartOptions
        })
    }
})

watch(() => props.chartData, (newData) => {
    if (chartInstance) {
        chartInstance.data = newData
        chartInstance.update()
    }
})

onBeforeUnmount(() => {
    chartInstance?.destroy()
})
</script>