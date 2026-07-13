import { defineStore, storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAgentStore } from './agent'
import { ElMessage } from 'element-plus'
import type { ClientCreditCard } from '@/types/client-credit-card'
import { useClientsStore } from './clients'

export const useCreditCardsStore = defineStore('creditCards', () => {
    const { authFetch } = useApi()
    const agentStore = useAgentStore()
    const clientsStore = useClientsStore()
    const { currentClientId } = storeToRefs(clientsStore)

    const creditCards = ref<ClientCreditCard[]>([])
    const isLoading = ref(false)
    const isSaving = ref(false)

    /**
     * 獲取指定客戶的所有信用卡列表
     * GET /api/v1/clients/{clientId}/credit-cards
     */
    async function fetchCreditCards() {
        if (!currentClientId.value) {
            creditCards.value = []
            return
        }
        isLoading.value = true
        try {
            const res = await authFetch(`/api/v1/clients/${currentClientId.value}/credit-cards`)
            if (res.ok) {
                creditCards.value = await res.json()
            } else if (res.status === 404) {
                creditCards.value = [] // 找不到資源，表示該客戶尚無信用卡資料
            } else {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || `獲取信用卡列表失敗 (status: ${res.status})`)
            }
        } catch (error: any) {
            console.error('Fetch credit cards error:', error)
            ElMessage.error(error.message || '獲取信用卡列表時發生錯誤')
            creditCards.value = []
        } finally {
            isLoading.value = false
        }
    }

    /**
     * 為指定客戶新增一張信用卡
     * POST /api/v1/clients/{clientId}/credit-cards
     */
    async function createCreditCard(cardData: Omit<ClientCreditCard, 'id' | 'clientId' | 'firebaseUid' | 'createdAt' | 'updatedAt'>) {
        if (!currentClientId.value) {
            return ElMessage.warning('請先選擇一位客戶')
        }
        if (!agentStore.isLoggedIn) {
            return ElMessage.warning('訪客模式無法儲存資料。')
        }
        isSaving.value = true
        try {
            const res = await authFetch(`/api/v1/clients/${currentClientId.value}/credit-cards`, {
                method: 'POST',
                body: cardData,
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || `新增信用卡失敗 (status: ${res.status})`)
            }

            const newCard = await res.json()
            creditCards.value.push(newCard)
            return newCard
        } catch (error: any) {
            console.error('Create credit card error:', error)
            ElMessage.error(error.message || '新增信用卡時發生錯誤')
            throw error
        } finally {
            isSaving.value = false
        }
    }

    /**
     * 更新指定的信用卡資料
     * PUT /api/v1/clients/{clientId}/credit-cards/{cardId}
     */
    async function updateCreditCard(cardId: string, cardData: Partial<ClientCreditCard>) {
        if (!currentClientId.value) {
            return ElMessage.warning('請先選擇一位客戶')
        }
        if (!agentStore.isLoggedIn) {
            return ElMessage.warning('訪客模式無法儲存資料。')
        }
        isSaving.value = true
        try {
            const res = await authFetch(`/api/v1/clients/${currentClientId.value}/credit-cards/${cardId}`, {
                method: 'PUT',
                body: cardData,
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || `更新信用卡失敗 (status: ${res.status})`)
            }

            const updatedCard = await res.json()
            const index = creditCards.value.findIndex(c => c.id === cardId)
            if (index !== -1) {
                creditCards.value[index] = updatedCard
            }
            return updatedCard
        } catch (error: any) {
            console.error('Update credit card error:', error)
            ElMessage.error(error.message || '更新信用卡時發生錯誤')
            throw error
        } finally {
            isSaving.value = false
        }
    }

    /**
     * 刪除指定的信用卡
     * DELETE /api/v1/clients/{clientId}/credit-cards/{cardId}
     */
    async function deleteCreditCard(cardId: string) {
        if (!currentClientId.value) {
            return ElMessage.warning('請先選擇一位客戶')
        }
        if (!agentStore.isLoggedIn) {
            return ElMessage.warning('訪客模式無法儲存資料。')
        }
        isSaving.value = true
        try {
            const res = await authFetch(`/api/v1/clients/${currentClientId.value}/credit-cards/${cardId}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || `刪除信用卡失敗 (status: ${res.status})`)
            }

            creditCards.value = creditCards.value.filter(c => c.id !== cardId)
        } catch (error: any) {
            console.error('Delete credit card error:', error)
            ElMessage.error(error.message || '刪除信用卡時發生錯誤')
            throw error
        } finally {
            isSaving.value = false
        }
    }

    watch(currentClientId, (newClientId) => {
        if (newClientId) {
            fetchCreditCards()
        } else {
            creditCards.value = []
        }
    }, { immediate: true })

    return {
        creditCards,
        isLoading,
        isSaving,
        fetchCreditCards,
        createCreditCard,
        updateCreditCard,
        deleteCreditCard,
    }
})