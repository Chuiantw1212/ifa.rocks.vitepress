<template>
    <el-card shadow="never" style="margin-bottom: 20px;">
        <template #header>
            <div class="card-header">
                <span>資料相依性</span>
            </div>
        </template>
        <el-alert
            title="每月勞退提撥總額 (來自職業收入)"
            type="info"
            :description="`${formatMoney(monthlyContributionPMT)} 元`"
            :closable="false"
            show-icon
        />
    </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useCareerStore } from '@/stores/career';

const careerStore = useCareerStore();
const { data: careerData } = storeToRefs(careerStore);

const monthlyContributionPMT = computed(() => careerData.value?.pensionTotalAmount || 0);

function formatMoney(val: number | undefined) {
    if (val === undefined) return '0';
    return Math.round(val).toLocaleString();
}
</script>