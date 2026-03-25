import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import { ElMessage } from 'element-plus'
import { useAgentStore } from './agent'
import { useMetadataStore } from './metadata'

// 這些類型定義未來可以集中到 src/types.ts
export interface Client {
  id: string;
  name: string;
  progress: number;
  lastUpdated: string;
  email?: string | null;
  phone?: string | null;
  lineId?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  currentAge?: number | null;
  lifeExpectancy?: number | null;
  marriageYear?: number | null;
  careerInsuranceType?: string | null;
  biography?: string | null;
}

export interface NewClientForm {
  name: string;
  email: string;
  phone?: string;
  lineId?: string;
}

export const useClientsStore = defineStore('clients', () => {
    const { authFetch } = useApi()
    const agentStore = useAgentStore()
    const metadataStore = useMetadataStore()

    const clientList = ref<Client[]>([])
    const isLoading = ref(true)
    const currentClientId = ref<string | null>(null)

    async function fetchClients() {
        if (!agentStore.isLoggedIn) {
            clientList.value = []
            isLoading.value = false
            return
        }
        isLoading.value = true
        try {
            const res = await authFetch('/api/v1/client-profiles')
            const data = await res.json()
            // API 回傳一個包含 list 屬性的物件
            if (data && Array.isArray(data.list)) {
                // 將 API 回傳的 client profile 對應到前端的 Client 型別
                // 並為儀表板所需的欄位提供預設值
                clientList.value = data.list.map((profile: any) => ({
                    ...profile,
                    progress: profile.progress || 0,
                    lastUpdated: profile.lastUpdated || new Date().toISOString().split('T')[0],
                }))
                // 新增邏輯：如果客戶列表不為空，且當前沒有選擇任何客戶，則預設選擇第一個
                if (clientList.value.length > 0 && !currentClientId.value) {
                    setCurrentClientId(clientList.value[0].id)
                }
            } else {
                console.warn('API /api/v1/client-profiles 並未回傳一個有效的列表物件', data)
                clientList.value = []
            }
        } catch (error: any) {
            console.error('Fetch clients error:', error)
            ElMessage.error(error.message || '取得客戶列表時發生未預期的錯誤')
            clientList.value = []
        } finally {
            isLoading.value = false
        }
    }

    async function createClient(form: NewClientForm) {
        const res = await authFetch('/api/v1/clients', { method: 'POST', body: form });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `建立客戶失敗 (status: ${res.status})`);
        }
        const newClientData = await res.json();

        // 優化：直接將新客戶加入列表，避免重新 fetch
        const newClientForList = {
            ...newClientData,
            progress: newClientData.progress || 0,
            lastUpdated: new Date().toISOString().split('T')[0],
        };
        clientList.value.unshift(newClientForList); // 加到列表最前面，讓使用者馬上看到

        if (newClientData && newClientData.id) {
            setCurrentClientId(newClientData.id);
        }
    }

    async function deleteClient(clientId: string) {
        try {
            const res = await authFetch(`/api/v1/client-profiles/${clientId}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `刪除客戶失敗 (status: ${res.status})`);
            }
            // 優化：直接從列表中移除，避免重新 fetch
            clientList.value = clientList.value.filter(c => c.id !== clientId);
            if (currentClientId.value === clientId) {
                currentClientId.value = clientList.value.length > 0 ? clientList.value[0].id : null;
            }
        } catch (error) {
            // 將錯誤向上拋出，讓 Vue 元件可以捕捉到並顯示 ElMessage
            throw error;
        }
    }

    function setCurrentClientId(id: string | null) {
        currentClientId.value = id
        console.log(`全域環境已切換至客戶 ID：${id}`)
    }

    // 修正：改為直接監聽 agentStore 的登入「狀態」，而不是監聽「動作」。
    // 這樣更可靠，能確保在登入狀態確立後才去獲取資料，完美解決您提出的設計。
    watch(() => agentStore.isLoggedIn, (isLoggedIn) => {
        if (isLoggedIn) {
            fetchClients();
            metadataStore.fetchMetadata();
        } else {
            // 登出時清空資料
            clientList.value = []
            currentClientId.value = null
        }
    }, { immediate: true })

    return {
        clientList, isLoading, currentClientId,
        fetchClients, createClient, deleteClient, setCurrentClientId
    }
})