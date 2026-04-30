import { defineStore, storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAgentStore } from './agent'
import { ElMessage } from 'element-plus'
import type { ClientCareer } from '@/types/client-career'
import { useClientsStore } from './clients'

/**
 * 提供一個乾淨的預設職業資料物件。
 */
const defaultCareerData: ClientCareer = {
    baseSalary: 0,
    otherAllowance: 0,
    laborInsurance: 0,
    healthInsurance: 0,
    otherDeduction: 0,
    pensionPersonalRate: 0,
    pensionPersonalAmount: 0,
    pensionEmployerAmount: 0,
    pensionTotalAmount: 0,
    stockDeduction: 0,
    stockCompanyMatch: 0,
    dependents: 0,
    monthlyNetIncome: 0,
    annualBonus: 0,
    annualTotalIncome: 0,
};

export const useCareerStore = defineStore('career', () => {
    const { authFetch } = useApi();
    const agentStore = useAgentStore();
    const clientsStore = useClientsStore();
    const { currentClientId } = storeToRefs(clientsStore);

    const data = ref<ClientCareer>({ ...defaultCareerData });
    const isLoading = ref(false);
    const isSaving = ref(false);

    /**
     * 從後端獲取當前選擇客戶的職業資料。
     */
    async function fetchCareerData() {
        // 如果沒有選擇客戶，則重置資料並返回
        if (!currentClientId.value) {
            data.value = { ...defaultCareerData };
            return;
        }
        isLoading.value = true;
        try {
            // API 端點已改為獲取指定客戶的職業資料
            const res = await authFetch(`/api/v1/clients/${currentClientId.value}/career`);
            if (res.ok) {
                const careerInfo = await res.json();
                data.value = { ...defaultCareerData, ...careerInfo };
            } else if (res.status !== 404) { // 404 表示尚無資料，是正常情況
                throw new Error(`取得客戶職業資料失敗 (status: ${res.status})`);
            }
        } catch (error: any) {
            console.error('Fetch career data error:', error);
            ElMessage.error(error.message || '取得客戶職業資料時發生錯誤');
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * 儲存當前客戶的職業資料到後端。
     */
    async function saveCareerData() {
        if (!currentClientId.value) {
            console.warn('無法儲存職業資料：未選擇客戶。');
            return;
        }
        if (!agentStore.isLoggedIn) {
            ElMessage.warning('訪客模式無法儲存資料。');
            return;
        }

        isSaving.value = true;
        try {
            const res = await authFetch(`/api/v1/clients/${currentClientId.value}/career`, {
                method: 'PUT',
                body: data.value,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `儲存職業資料失敗 (status: ${res.status})`);
            }
        } catch (error: any) {
            console.error('Save career data error:', error);
            ElMessage.error(error.message || '儲存職業資料時發生錯誤');
            throw error; // Re-throw to allow component to handle it
        } finally {
            isSaving.value = false;
        }
    }

    // 改為監聽當前選擇的客戶 ID，並在變更時獲取對應的職業資料
    watch(currentClientId, (newClientId) => {
        if (newClientId) {
            fetchCareerData();
        } else {
            // 如果沒有選擇客戶 (例如，登出或刪除所有客戶後)，則重置資料
            data.value = { ...defaultCareerData };
        }
    }, { immediate: true });

    return {
        data,
        isLoading,
        isSaving,
        fetchCareerData,
        saveCareerData,
    };
});