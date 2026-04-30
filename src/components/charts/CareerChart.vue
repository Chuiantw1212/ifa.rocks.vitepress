<template>
    <div class="chart-container">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, watch } from 'vue'
import { debounce } from 'lodash-es'
import Chart from 'chart.js/auto'
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js'
import type { UserCareer } from '@/components/career/types/user'

const props = defineProps<{
    data: UserCareer
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
// 2. 明確指定這是一個 Bar Chart 的實例
const chartInstance = shallowRef<Chart<'bar'> | null>(null)

const formatNumber = (num: number) => {
    if (num === undefined || isNaN(num)) return '0'
    return new Intl.NumberFormat('zh-TW').format(Math.round(num))
}

const renderChart = debounce(() => {
    if (!canvasRef.value) return

    const m = props.data
    let pv = 0
    let fv = 0
    const nodes: { label: string, data: [number, number], type: 0 | 1 }[] = []

    // ... (中間計算邏輯保持不變) ...
    // 1. 本薪
    fv = m.baseSalary || 0
    nodes.push({ label: '本薪', data: [pv, fv], type: 0 })

    // 2. 伙食津貼
    pv = fv
    fv += 3000
    nodes.push({ label: '伙食津貼', data: [pv, fv], type: 0 })

    // 3. 其他津貼
    if ((m.otherAllowance || 0) > 0) {
        pv = fv
        fv += m.otherAllowance
        nodes.push({ label: '其他津貼', data: [pv, fv], type: 0 })
    }

    // 扣除項目
    const deductions = [
        { label: '健保', val: m.healthInsurance },
        { label: '勞保', val: m.laborInsurance },
        { label: '勞退自提', val: m.pensionPersonalAmount },
        { label: '員工認股', val: m.stockDeduction },
        { label: '其他扣款', val: m.otherDeduction }
    ]

    deductions.forEach(d => {
        if ((d.val || 0) > 0) {
            pv = fv
            fv -= d.val!
            // For floating bars, data should be [min, max]
            nodes.push({ label: d.label, data: [fv, pv], type: 1 })
        }
    })

    // 月實領
    nodes.push({ label: '月實領', data: [0, fv], type: 0 })

    const labels = nodes.map(n => n.label)

    // Dataset 0: 收入
    const dataIncome = nodes.map(n => n.type === 0 ? n.data : [0, 0] as [number, number])

    const dataDeduction = nodes.map(n => n.type === 1 ? n.data : [0, 0] as [number, number])

    const chartData: ChartData<'bar'> = {
        labels,
        datasets: [
            {
                label: '收入/結餘',
                data: dataIncome,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                borderRadius: 2,
                borderSkipped: false,
            },
            {
                label: '扣除項目',
                data: dataDeduction,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                borderRadius: 2,
                borderSkipped: false,
            }
        ]
    }

    const chartOptions: ChartOptions<'bar'> = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: TooltipItem<'bar'>) => {
                        const raw = context.raw as [number, number]
                        const val = Math.abs(raw[1] - raw[0])
                        return `${context.dataset.label}: ${formatNumber(val)}`
                    }
                }
            },
            legend: { display: false }
        },
        scales: {
            y: { stacked: true },
            x: {
                stacked: true,
                ticks: {
                    callback: function (value) {
                        if (typeof value === 'number') {
                            return (value / 1000) + 'k'
                        }
                        return value
                    }
                }
            }
        }
    }

    // 初始化或更新圖表
    if (chartInstance.value) {
        chartInstance.value.data = chartData
        chartInstance.value.options = chartOptions
        chartInstance.value.update('none') // 'none' for no animation on update
    } else {
        chartInstance.value = new Chart(canvasRef.value, {
            type: 'bar',
            data: chartData,
            options: chartOptions
        })
    }
}, 300)

watch(() => props.data, () => {
    renderChart()
}, { deep: true })

onMounted(() => {
    renderChart()
})
</script>

<style scoped>
.chart-container {
    height: 350px;
    position: relative;
    width: 100%;
}
</style>