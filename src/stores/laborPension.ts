import { defineStore, storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAgentStore } from './agent'
import { ElMessage } from 'element-plus'
import type { ClientLaborPension } from '@/types/client-labor-pension'
import { useClientsStore } from './clients'

const defaultLaborPension: ClientLaborPension = {
    expectedRetirementAge: 65,
    remainingLifeAtRetirement: 20,
    retirementRoi: 3.0,
    employerContribution: 0,
    employerEarnings: 0,
    personalContribution: 0,
    personalEarnings: 0,
    currentWorkSeniority: 0,
    predictedLumpSum: 0,
    predictedNetLumpSum: 0,
};


export const useLaborPensionStore = defineStore('laborPension', () => {
    const { authFetch } = useApi();
    const agentStore = useAgentStore();
    const clientsStore = useClientsStore();
    const { currentClientId } = storeToRefs(clientsStore);

    const data = ref<ClientLaborPension>({ ...defaultLaborPension });
    const isLoading = ref(false);
    const isSaving = ref(false);

    /**
     * 從後端獲取當前選擇客戶的勞工退休金資料。
     */
    async function fetchLaborPensionData() {
        // 如果沒有選擇客戶，則重置資料並返回
        if (!currentClientId.value) {
            data.value = { ...defaultLaborPension };
            return;
        }
        isLoading.value = true;
        try {
            // API 端點獲取指定客戶的勞工退休金資料
            const res = await authFetch(`/api/v1/clients/${currentClientId.value}/labor-pension`);
            if (res.ok) {
                const responseText = await res.text();
                // 如果回應是 200 OK 但內容為空，也視為尚無資料，套用預設值
                if (responseText) {
                    const laborPensionInfo = JSON.parse(responseText);
                    data.value = { ...defaultLaborPension, ...laborPensionInfo };
                } else {
                    data.value = { ...defaultLaborPension };
                }
            } else if (res.status === 404) {
                // 404 表示尚無資料，是正常情況，重置為預設值
                data.value = { ...defaultLaborPension };
            } else {
                throw new Error(`取得客戶勞退資料失敗 (status: ${res.status})`);
            }
        } catch (error: any) {
            console.error('Fetch labor pension data error:', error);
            ElMessage.error(error.message || '取得客戶勞退資料時發生錯誤');
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * 儲存當前客戶的勞工退休金資料到後端。
     */
    async function saveLaborPensionData() {
        if (!currentClientId.value) {
            console.warn('無法儲存勞退資料：未選擇客戶。');
            return;
        }
        if (!agentStore.isLoggedIn) {
            ElMessage.warning('訪客模式無法儲存資料。');
            return;
        }

        isSaving.value = true;
        try {
            const res = await authFetch(`/api/v1/clients/${currentClientId.value}/labor-pension`, {
                method: 'PUT',
                body: data.value,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `儲存勞退資料失敗 (status: ${res.status})`);
            }
        } catch (error: any) {
            console.error('Save labor pension data error:', error);
            ElMessage.error(error.message || '儲存勞退資料時發生錯誤');
            throw error; // Re-throw to allow component to handle it
        } finally {
            isSaving.value = false;
        }
    }

    // 監聽當前選擇的客戶 ID，並在變更時獲取對應的勞工退休金資料
    watch(currentClientId, (newClientId) => {
        if (newClientId) {
            fetchLaborPensionData();
        } else {
            // 如果沒有選擇客戶 (例如，登出或刪除所有客戶後)，則重置資料
            data.value = { ...defaultLaborPension };
        }
    }, { immediate: true });

    return {
        data,
        isLoading,
        isSaving,
        fetchLaborPensionData,
        saveLaborPensionData,
    };
});