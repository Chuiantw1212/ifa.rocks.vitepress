import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { ElMessage } from 'element-plus'
import { useAgentStore } from './agent'

// 這些類型定義未來可以集中到 src/types.ts
type ClientStatus = '陌生名單' | '資料收集' | '即將提案' | '已結案';

export interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  progress: number;
  lastUpdated: string;
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

    const clientList = ref<Client[]>([])
    const isLoading = ref(true)
    const currentClientId = ref<string | null>(null)

    const statusSummary = computed(() => {
        const initialSummary: Record<ClientStatus, number> = {
            '陌生名單': 0,
            '資料收集': 0,
            '即將提案': 0,
            '已結案': 0,
        };
        return (clientList.value || []).reduce((summary, client) => {
            if (summary[client.status] !== undefined) {
                summary[client.status]++;
            }
            return summary;
        }, initialSummary);
    });

    async function fetchClients() {
        if (!agentStore.isLoggedIn) {
            clientList.value = []
            isLoading.value = false
            return
        }
        isLoading.value = true
        try {
            const res = await authFetch('/api/v1/clients')
            const data = await res.json()
            clientList.value = data
        } catch (error: any) {
            console.error('Fetch clients error:', error)
            ElMessage.error(error.message || '取得客戶列表時發生未預期的錯誤')
            clientList.value = []
        } finally {
            isLoading.value = false
        }
    }

    async function createClient(form: NewClientForm) {
        const res = await authFetch('/api/v1/clients', {
            method: 'POST',
            body: form
        })
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.message || `建立客戶失敗 (status: ${res.status})`)
        }
        await fetchClients() // 重新獲取列表
        const newClient = clientList.value[clientList.value.length - 1]
        if (newClient) {
            setCurrentClientId(newClient.id)
        }
    }

    async function deleteClient(clientId: string) {
        await authFetch(`/api/v1/clients/${clientId}`, { method: 'DELETE' })
        await fetchClients() // 重新獲取列表
        if (currentClientId.value === clientId) {
            currentClientId.value = clientList.value.length > 0 ? clientList.value[0].id : null
        }
    }

    function setCurrentClientId(id: string | null) {
        currentClientId.value = id
        console.log(`全域環境已切換至客戶 ID：${id}`)
    }

    // 監聽登入/登出狀態，自動獲取或清空客戶列表
    agentStore.$onAction(({ name, after }) => {
        if (name === 'init' || name === 'setToken' || name === 'logout') {
            after(() => fetchClients())
        }
    })

    return {
        clientList, isLoading, currentClientId, statusSummary,
        fetchClients, createClient, deleteClient, setCurrentClientId
    }
})