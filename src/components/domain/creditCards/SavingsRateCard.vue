<template>
  <el-card shadow="never" style="margin-top: 24px;">
    <template #header>
      <div class="card-header">
        <span style="font-weight: bold; font-size: 16px;">儲蓄率健診</span>
      </div>
    </template>

    <div v-if="monthlyIncome > 0">
      <el-row :gutter="16" justify="center" style="text-align: center;">
        <el-col :span="6" :xs="12">
          <el-statistic :value="monthlyIncome" title="月收入" />
        </el-col>
        <el-col :span="6" :xs="12">
          <el-statistic :value="monthlyExpenses" title="月支出 (信用卡)" />
        </el-col>
        <el-col :span="6" :xs="12">
          <el-statistic :value="monthlySavings" title="月儲蓄">
            <template #formatter>
              <span :style="{ color: monthlySavings < 0 ? 'var(--el-color-danger)' : 'var(--el-color-success)' }">
                {{ Math.round(monthlySavings).toLocaleString() }}
              </span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6" :xs="12">
          <el-statistic title="儲蓄率">
            <template #formatter>
              <span :style="{ color: savingsRate < 10 ? 'var(--el-color-danger)' : 'inherit' }">
                {{ savingsRate.toFixed(1) }}%
              </span>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-divider style="margin: 24px 0;" />

      <el-alert
        v-if="userPercentile > 0"
        :title="`恭喜！您 ${savingsRate.toFixed(1)}% 的儲蓄率，已超越了全國約 ${userPercentile.toFixed(0)}% 的人！`"
        type="success"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      />
       <el-alert
        v-else
        title="您的支出已大於收入，請檢視消費習慣，或尋求專業顧問協助。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      />

      <div style="position: relative; height: 350px;">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <el-empty v-else description="請先至「勞保與勞退」分頁填寫職業收入，以進行儲蓄率分析。">
       <el-button type="primary" @click="goToLaborPage">立即前往</el-button>
    </el-empty>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, shallowRef } from 'vue';
import { useRouter } from 'vitepress';
import { storeToRefs } from 'pinia';
import { useCareerStore } from '@/stores/career';
import { useCreditCardsStore } from '@/stores/creditCards';
import { useMetadataStore } from '@/stores/metadata';
import {
    Chart as ChartJS,
    type ChartData,
    type ChartOptions,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// 註冊 Chart.js 元件與插件
// 註：請確保已安裝 chartjs-plugin-annotation
ChartJS.register(
    LineController, LineElement, PointElement, LinearScale,
    Title, Tooltip, Legend, Filler, annotationPlugin
);

const router = useRouter();

// --- Stores ---
const careerStore = useCareerStore();
const creditCardsStore = useCreditCardsStore();
const { data: careerData } = storeToRefs(careerStore);
const { creditCards } = storeToRefs(creditCardsStore);
const metadataStore = useMetadataStore();
const { metadata } = storeToRefs(metadataStore);

// --- Data Calculation ---
const monthlyIncome = computed(() => careerData.value?.monthlyNetIncome || 0);
const monthlyExpenses = computed(() =>
  creditCards.value.reduce((sum, card) => sum + (card.averageMonthlyExpense || 0), 0)
);
const monthlySavings = computed(() => monthlyIncome.value - monthlyExpenses.value);
const savingsRate = computed(() => {
  if (monthlyIncome.value <= 0) return 0;
  return (monthlySavings.value / monthlyIncome.value) * 100;
});

// --- Percentile Calculation ---
// 從 metadata 獲取儲蓄率對應人口百分位的資料
const savingsDistribution = computed(() => {
  const deciles = metadata.value?.opt_savings_rate_deciles?.list || [];
  if (deciles.length === 0) return [];
  return deciles.map(item => ({
    p: Number(item.code),    // 百分位
    rate: Number(item.label) // 儲蓄率
  })).sort((a, b) => a.p - b.p);
});

const userPercentile = computed(() => {
  if (savingsDistribution.value.length === 0) return 0;
  const rate = savingsRate.value;
  if (rate <= savingsDistribution.value[0].rate) return 0;
  if (rate >= savingsDistribution.value[savingsDistribution.value.length - 1].rate) return 100;

  for (let i = 1; i < savingsDistribution.value.length; i++) {
    const p_low = savingsDistribution.value[i - 1];
    const p_high = savingsDistribution.value[i];
    if (rate >= p_low.rate && rate < p_high.rate) {
      const fraction = (rate - p_low.rate) / (p_high.rate - p_low.rate);
      return p_low.p + fraction * (p_high.p - p_low.p);
    }
  }
  return 100;
});

// --- Chart ---
const chartCanvas = ref<HTMLCanvasElement | null>(null);
const chartInstance = shallowRef<ChartJS<'line'> | null>(null);

const chartData = computed<ChartData<'line'>>(() => ({
  datasets: [
    {
      label: '儲蓄率分佈曲線',
      data: savingsDistribution.value.map(p => ({ x: p.p, y: p.rate })),
      borderColor: 'rgba(64, 158, 255, 1)',
      backgroundColor: 'rgba(64, 158, 255, 0.2)',
      fill: 'origin',
      tension: 0.4,
    },
  ],
}));

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items) => `約在 ${Number(items[0].parsed.x).toFixed(0)}% 的人口`,
        label: (item) => `儲蓄率約為 ${Number(item.parsed.y).toFixed(1)}%`,
      },
    },
    annotation: {
      annotations: {
        userLine: {
          type: 'line',
          xMin: userPercentile.value,
          xMax: userPercentile.value,
          borderColor: 'rgba(231, 76, 60, 0.8)',
          borderWidth: 2,
          borderDash: [6, 6],
          label: {
            content: '您的位置',
            enabled: true,
            position: 'start',
            backgroundColor: 'rgba(231, 76, 60, 0.8)',
            font: { size: 12 },
          },
        },
      },
    },
  },
  scales: {
    x: {
      type: 'linear',
      title: { display: true, text: '人口百分位 (%)' },
      min: 0,
      max: 100,
    },
    y: {
      title: { display: true, text: '儲蓄率 (%)' },
      ticks: { callback: (value) => `${value}%` },
    },
  },
}));

const renderChart = () => {
  if (!chartCanvas.value) return;
  if (chartInstance.value) {
    chartInstance.value.data = chartData.value;
    chartInstance.value.options = chartOptions.value;
    chartInstance.value.update();
  } else {
    chartInstance.value = new ChartJS(chartCanvas.value, {
      type: 'line',
      data: chartData.value,
      options: chartOptions.value,
    });
  }
};

const goToLaborPage = () => {
  router.go('/pro/labor');
};

onMounted(renderChart);
watch([chartData, chartOptions], renderChart, { deep: true });
</script>