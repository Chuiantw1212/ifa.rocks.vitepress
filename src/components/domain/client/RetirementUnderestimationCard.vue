<template>
  <el-card v-if="planningYearsDifference > 0" shadow="never">
    <template #header>
      <div style="display: flex; align-items: center; font-weight: bold; font-size: 16px;">
        <el-icon style="margin-right: 8px;"><Warning /></el-icon>
        <span>退休規劃的常見盲點：您可能低估了「退休後」的規劃年期</span>
      </div>
    </template>

    <!-- Chart -->
    <div style="position: relative; height: 150px; margin-bottom: 24px;">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <!-- Summary -->
    <div>
      <div style="display: flex; align-items: flex-start;">
        <el-icon style="margin-right: 8px; color: var(--el-color-warning); font-size: 18px; margin-top: 2px;"><Warning /></el-icon>
        <div>
          <p style="font-weight: bold; font-size: 16px; color: var(--el-text-color-primary); margin: 0; line-height: 1.5;">
            {{ `您的退休準備年期可能低估了 ${planningYearsDifference} 年，相當於 ${underestimationPercentage.toFixed(0)}% 的缺口！` }}
          </p>
          <p style="line-height: 1.7; margin: 8px 0 0 0; font-size: 14px; color: var(--el-text-color-regular);">
            上圖顯示，若僅用<b>您現在這個年紀</b>的平均餘命推算，您的退休準備年期為 <el-text type="primary" style="font-weight: bold;">{{ commonPostRetirementYears }}</el-text> 年。
             </p>
           <p style="line-height: 1.7; margin: 8px 0 0 0; font-size: 14px; color: var(--el-text-color-regular);"> 但更精確的作法，是採用您<b>退休當天</b>的預期餘命來規劃，實際上應準備 <el-text type="danger" style="font-weight: bold;">{{ actualPostRetirementYears }}</el-text> 年，且最好每年重新評估。這個差異將導致退休金準備出現嚴重缺口。
          </p>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, onMounted, watch } from 'vue'
import { useAgent } from '@/composables/useAgent'
import { Warning } from '@element-plus/icons-vue'
import {
    Chart as ChartJS,
    type ChartData,
    type ChartOptions,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register Chart.js components and plugins
ChartJS.register(
    BarController, BarElement, CategoryScale, LinearScale,
    Title, Tooltip, Legend, annotationPlugin
);

const { agentPlan: clientPlan } = useAgent()

// --- Data Calculation ---
const retirementAge = computed(() => clientPlan.value.profile?.retirementAge || 0);
const lifeExpectancy = computed(() => clientPlan.value.profile?.lifeExpectancy || 0);
const currentAge = computed(() => clientPlan.value.profile?.currentAge || 0);

// 普遍認知：用 (現在餘命) - (距離退休年數)
const commonPostRetirementYears = computed(() => {
    if (!currentAge.value || !lifeExpectancy.value || !retirementAge.value) {
        return 0;
    }
    // The calculation is equivalent to: lifeExpectancy - (retirementAge - currentAge)
    const expectedDeathAge = currentAge.value + lifeExpectancy.value;
    const years = expectedDeathAge - retirementAge.value;
    return years > 0 ? Math.round(years) : 0;
})

// 更精確的計算：直接採用退休後的預期餘命
const actualPostRetirementYears = computed(() => Math.round(clientPlan.value.profile?.lifeExpectancyAtRetirement || 0))

// 差異年數
const planningYearsDifference = computed(() => {
  const actual = actualPostRetirementYears.value;
  const common = commonPostRetirementYears.value;
  if (actual > 0 && common > 0 && actual > common) {
    return actual - common;
  }
  return 0;
})

// 低估的百分比
const underestimationPercentage = computed(() => {
    if (commonPostRetirementYears.value > 0 && planningYearsDifference.value > 0) {
        return (planningYearsDifference.value / commonPostRetirementYears.value) * 100;
    }
    return 0;
})

// --- Chart ---
const chartCanvas = ref<HTMLCanvasElement | null>(null);
const chartInstance = shallowRef<ChartJS<'bar'> | null>(null);

const chartData = computed<ChartData<'bar'>>(() => ({
  // 標籤順序對應我們希望的視覺順序（由上到下）
  labels: ['普遍認知', '更精確'],
  datasets: [
    {
      label: '退休前',
      data: [retirementAge.value, retirementAge.value],
      backgroundColor: 'rgba(144, 147, 153, 0.3)',
      barPercentage: 0.7,
      categoryPercentage: 1.0,
    },
    {
      label: `普遍認知準備年期 (${commonPostRetirementYears.value}年)`,
      data: [commonPostRetirementYears.value, commonPostRetirementYears.value],
      backgroundColor: 'rgba(64, 158, 255, 0.7)',
      barPercentage: 0.7,
      categoryPercentage: 1.0,
    },
    {
      label: `低估的缺口 (${planningYearsDifference.value}年)`,
      // 缺口數據對應到 '更精確'，也就是 labels 陣列中的第二個元素 (index 1)
      data: [0, planningYearsDifference.value],
      backgroundColor: 'rgba(245, 108, 108, 0.7)',
      barPercentage: 0.7,
      categoryPercentage: 1.0,
    },
  ],
}));

const chartOptions = computed<ChartOptions<'bar'>>(() => {
  const commonEndAge = retirementAge.value + commonPostRetirementYears.value;
  const actualEndAge = retirementAge.value + actualPostRetirementYears.value;
  const maxAge = Math.max(commonEndAge, actualEndAge);

  return {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 30, // Make space for end age label
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: '年齡',
        },
        min: 0,
        max: Math.ceil(maxAge / 10) * 10 + 5, // Round up to nearest 10 and add padding
      },
      y: {
        stacked: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        align: 'start',
      },
      tooltip: {
        enabled: false,
      },
      annotation: {
        annotations: {
          retirementLine: {
            type: 'line',
            xMin: retirementAge.value,
            xMax: retirementAge.value,
            borderColor: 'rgba(0, 0, 0, 0.6)',
            borderWidth: 1,
            borderDash: [6, 6],
            label: {
              content: `退休 ${retirementAge.value}歲`,
              enabled: true,
              position: 'start',
              yAdjust: -10,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              font: { size: 12 },
            },
          },
          commonEndAgeLabel: {
            type: 'label',
            xValue: commonEndAge,
            yValue: 0, // 對應到 Y 軸上方的「普遍認知」
            content: `${commonEndAge}歲`,
            font: { size: 12 },
            color: 'rgba(0, 0, 0, 0.8)',
            xAdjust: 15,
          },
          actualEndAgeLabel: {
            type: 'label',
            xValue: actualEndAge,
            yValue: 1, // 對應到 Y 軸下方的「更精確」
            content: `${actualEndAge}歲`,
            font: { size: 12 },
            color: 'rgba(0, 0, 0, 0.8)',
            xAdjust: 15,
          },
        },
      },
    },
  }
});

const renderChart = () => {
  if (!chartCanvas.value) return;
  if (chartInstance.value) {
    chartInstance.value.data = chartData.value;
    chartInstance.value.options = chartOptions.value;
    chartInstance.value.update();
  } else {
    chartInstance.value = new ChartJS(chartCanvas.value, { type: 'bar', data: chartData.value, options: chartOptions.value });
  }
};

onMounted(renderChart);
watch([chartData, chartOptions], renderChart, { deep: true, flush: 'post' });
</script>