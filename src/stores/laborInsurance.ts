import { defineStore, storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAgentStore } from './agent'
import { ElMessage } from 'element-plus'
import type { ClientLaborInsurance } from '@/types/client-labor-insurance'
import { useClientsStore } from './clients'

const defaultLaborInsurance: ClientLaborInsurance = {
    expectedClaimAge: 65,
    averageMonthlySalary: 45800,
    insuranceSeniority: 0,
    predictedRemainingLife: 20,
    predictedMonthlyAnnuity: 0,
};


export const useLaborInsuranceStore = defineStore('laborInsurance', () => {
    const { authFetch } = useApi();
    const agentStore = useAgentStore();
    const clientsStore = useClientsStore();
    const { currentClientId } = storeToRefs(clientsStore);

    const data = ref<ClientLaborInsurance>({ ...defaultLaborInsurance });
    const isLoading = ref(false);
    const isSaving = ref(false);
    // State for the chart component
    const lifeExpectancyRange = ref<Array<{ age: number; expectedLifespan: number }>>([]);
    const isRangeLoading = ref(false);

    /**
     * 從後端獲取當前選擇客戶的勞工保險資料。
     */
    async function fetchLaborInsuranceData() {
        // 如果沒有選擇客戶，則重置資料並返回
        if (!currentClientId.value) {
            data.value = { ...defaultLaborInsurance };
            return;
        }
        isLoading.value = true;
        try {
            // API 端點獲取指定客戶的勞工保險資料
            const res = await authFetch(`/api/v1/clients/${currentClientId.value}/labor-insurance`);
            if (res.ok) {
                const responseText = await res.text();
                // 如果回應是 200 OK 但內容為空，也視為尚無資料，套用預設值
                if (responseText) {
                    const laborInsuranceInfo = JSON.parse(responseText);
                    data.value = { ...defaultLaborInsurance, ...laborInsuranceInfo };
                } else {
                    data.value = { ...defaultLaborInsurance, clientId: currentClientId.value };
                }
            } else if (res.status === 404) {
                // 404 表示尚無資料，是正常情況，重置為預設值
                data.value = { ...defaultLaborInsurance, clientId: currentClientId.value };
            } else {
                throw new Error(`取得客戶勞保資料失敗 (status: ${res.status})`);
            }
        } catch (error: any) {
            console.error('Fetch labor insurance data error:', error);
            ElMessage.error(error.message || '取得客戶勞保資料時發生錯誤');
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * 儲存當前客戶的勞工保險資料到後端。
     */
    async function saveLaborInsuranceData() {
        if (!currentClientId.value) {
            console.warn('無法儲存勞保資料：未選擇客戶。');
            return;
        }
        if (!agentStore.isLoggedIn) {
            ElMessage.warning('訪客模式無法儲存資料。');
            return;
        }

        isSaving.value = true;
        try {
            const res = await authFetch(`/api/v1/clients/${currentClientId.value}/labor-insurance`, {
                method: 'PUT',
                body: data.value,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `儲存勞保資料失敗 (status: ${res.status})`);
            }
        } catch (error: any) {
            console.error('Save labor insurance data error:', error);
            ElMessage.error(error.message || '儲存勞保資料時發生錯誤');
            throw error; // Re-throw to allow component to handle it
        } finally {
            isSaving.value = false;
        }
    }

    // 監聽當前選擇的客戶 ID，並在變更時獲取對應的勞工保險資料
    watch(currentClientId, (newClientId) => {
        if (newClientId) {
            fetchLaborInsuranceData();
        } else {
            data.value = { ...defaultLaborInsurance };
        }
    }, { immediate: true });

    /**
     * 更新用於圖表的全距預估餘命資料。
     * @param rangeData - 從 API 取得的餘命陣列
     */
    function setLifeExpectancyRange(rangeData: Array<{ age: number; expectedLifespan: number }>) {
        lifeExpectancyRange.value = rangeData;
    }

    return {
        data,
        isLoading,
        isSaving,
        lifeExpectancyRange,
        isRangeLoading,
        fetchLaborInsuranceData,
        saveLaborInsuranceData,
        setLifeExpectancyRange,
    };
});