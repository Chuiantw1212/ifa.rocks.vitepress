import { ref, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import { getInitialUserPlan } from '@/composables/initialState'
import { useClientsStore } from '@/stores/clients'
import type { ClientPlan } from '@/types'
import { ElMessage } from 'element-plus'

// This state is for the currently selected client's plan
const clientPlan = ref<ClientPlan>(getInitialUserPlan())
const isDataReady = ref(false)

export function useClientPlan() {
    const { authFetch } = useApi()
    const clientsStore = useClientsStore()

    /**
     * Fetches the financial plan for a specific client.
     * @param clientId The ID of the client whose plan is to be fetched.
     */
    async function fetchClientPlanData(clientId: string) {
        if (!clientId) {
            resetClientPlan()
            isDataReady.value = true
            return
        }

        try {
            isDataReady.value = false
            // API endpoints are assumed based on the agent's plan endpoints.
            // Please adjust them to match your actual backend API routes.
            const [
                basePlanRes,
                portfolioRes,
                realEstateRes,
                businessesRes,
                creditCardsRes
            ] = await Promise.all([
                authFetch(`/api/v1/clients/${clientId}/plan`),
                authFetch(`/api/v1/clients/${clientId}/plan/portfolios`),
                authFetch(`/api/v1/clients/${clientId}/plan/real-estates`),
                authFetch(`/api/v1/clients/${clientId}/plan/businesses`, { params: { currentPage: 1, pageSize: 100 } }),
                authFetch(`/api/v1/clients/${clientId}/plan/credit-cards`),
            ])

            resetClientPlan()

            if (basePlanRes.ok) {
                const basePlanData = await basePlanRes.json()
                if (basePlanData) {
                    for (const key in basePlanData) {
                        if (Object.prototype.hasOwnProperty.call(basePlanData, key)) {
                            const apiValue = basePlanData[key];
                            if (apiValue !== null && clientPlan.value.hasOwnProperty(key)) {
                                (clientPlan.value as any)[key] = apiValue;
                            }
                        }
                    }
                }
            }

            if (portfolioRes.ok) {
                const data = await portfolioRes.json()
                if (Array.isArray(data)) clientPlan.value.portfolios = data
            }
            if (realEstateRes.ok) {
                const data = await realEstateRes.json()
                if (Array.isArray(data)) clientPlan.value.realEstates = data
            }
            if (businessesRes.ok) {
                const data = await businessesRes.json()
                if (data && Array.isArray(data.list)) clientPlan.value.businesses = data
            }
            if (creditCardsRes.ok) {
                const data = await creditCardsRes.json()
                if (Array.isArray(data)) clientPlan.value.creditCards = data
                else if (data && Array.isArray(data.list)) clientPlan.value.creditCards = data.list
            }

        } catch (e) {
            console.error(`Failed to fetch plan for client ${clientId}:`, e)
            ElMessage.error('讀取客戶規劃書時發生錯誤')
            resetClientPlan()
        } finally {
            isDataReady.value = true
        }
    }

    function resetClientPlan() {
        clientPlan.value = getInitialUserPlan()
    }

    function initClientPlanListener() {
        watch(() => clientsStore.currentClientId, (newClientId) => {
            if (newClientId) {
                fetchClientPlanData(newClientId)
            } else {
                resetClientPlan()
            }
        }, { immediate: true })
    }

    return {
        clientPlan,
        isDataReady,
        fetchClientPlanData,
        resetClientPlan,
        initClientPlanListener,
    }
}