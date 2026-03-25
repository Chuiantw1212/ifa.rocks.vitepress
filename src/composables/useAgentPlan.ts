import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useApi } from '@/composables/useApi'
import { getInitialUserPlan } from '@/composables/initialState'
import type { ClientPlan, FirebaseClient } from '@/types'
import { useAgentStore } from '@/stores/agent'
import { getAuth, signOut } from 'firebase/auth'

const agentPlan = ref<ClientPlan>(getInitialUserPlan())
const loggedInUser = ref<FirebaseClient>({
    id: "", uid: "", displayName: "訪客", email: "", photoUrl: "", isAnonymous: true
})
const isDataReady = ref(false)

export function useAgentPlan() {
    const { authFetch } = useApi()
    const agentStore = useAgentStore()

    /**
     * 監聽 agent (顧問) 登入狀態，並同步其個人規劃資料。
     * 這個 watcher 應該在應用程式的根組件或佈局組件中被初始化一次，以確保 agent 資料隨時同步。
     */
    function initAgentListener() {
        return watch(() => agentStore.agent, async (currentAgent) => {
            if (!agentStore.isInitialized) return;

            if (currentAgent) {
                loggedInUser.value = {
                    uid: currentAgent.uid,
                    displayName: currentAgent.username,
                    email: currentAgent.email,
                    photoUrl: currentAgent.avatarUrl,
                    isAnonymous: false,
                    id: ''
                }
                await fetchAgentPlanData()
            } else {
                _resetToGuest();
            }
        }, { immediate: true, deep: true });
    }

    async function logout() {
        try {
            isDataReady.value = false
            const auth = getAuth()
            await signOut(auth)
            ElMessage.success('已安全登出')
        } catch (e: any) {
            console.error('Logout failed', e)
            ElMessage.error('登出失敗')
        }
    }

    function resetAgentPlan() {
        agentPlan.value = getInitialUserPlan()
    }

    function _resetToGuest() {
        loggedInUser.value = {
            id: "", uid: "", displayName: "訪客", email: "", photoUrl: "", isAnonymous: true
        }
        resetAgentPlan()
        isDataReady.value = true
    }

    function clearDatabaseIds(form: ClientPlan) {
        if (form.profile) form.profile.id = ""
        if (form.career) form.career.id = ""
        if (form.retirement) form.retirement.id = ""
        if (form.tax) form.tax.id = ""
        if (form.laborInsurance) form.laborInsurance.id = ""
        if (form.laborPension) form.laborPension.id = ""
        form.portfolios?.forEach(i => i.id = "")
        form.realEstates?.forEach(i => i.id = "")
        form.creditCards?.forEach(i => i.id = "")
        if (form.businesses && Array.isArray(form.businesses.list)) {
            form.businesses.list.forEach(i => i.id = "")
        }
    }

    async function fetchAgentPlanData() {
        try {
            isDataReady.value = false
            const userRes = await authFetch('/api/v1/client/me').catch(error => {
                console.warn('無法取得使用者資料，嘗試建立新使用者...', error);
                return authFetch('/api/v1/client/me', { method: 'POST' });
            });
            const baseUserData = await userRes.json()
            if (baseUserData) {
                for (const key in baseUserData) {
                    if (Object.prototype.hasOwnProperty.call(baseUserData, key)) {
                        if (['portfolios', 'realEstates', 'businesses', 'creditCards'].includes(key)) {
                            continue;
                        }
                        const apiValue = baseUserData[key];
                        if (apiValue !== null && agentPlan.value.hasOwnProperty(key)) {
                            (agentPlan.value as any)[key] = apiValue;
                        }
                    }
                }
                if (baseUserData.id) {
                    loggedInUser.value.id = String(baseUserData.id)
                }
            }
            const [portfolioRes, realEstateRes, businessesRes, creditCardsRes] = await Promise.all([
                authFetch('/api/v1/client/portfolios'),
                authFetch('/api/v1/client/real-estates'),
                authFetch('/api/v1/client/businesses', { params: { currentPage: 1, pageSize: 100 } }),
                authFetch('/api/v1/client/credit-cards'),
            ])
            if (portfolioRes.ok) {
                const data = await portfolioRes.json()
                if (Array.isArray(data)) agentPlan.value.portfolios = data
            }
            if (realEstateRes.ok) {
                const data = await realEstateRes.json()
                if (Array.isArray(data)) agentPlan.value.realEstates = data
            }
            if (businessesRes.ok) {
                const data = await businessesRes.json()
                if (data && Array.isArray(data.list)) {
                    agentPlan.value.businesses = data
                }
            }
            if (creditCardsRes.ok) {
                const data = await creditCardsRes.json();
                if (Array.isArray(data)) {
                    agentPlan.value.creditCards = data;
                } else if (data && Array.isArray(data.list)) {
                    agentPlan.value.creditCards = data.list;
                }
            }
        } catch (e) {
            console.error("fetchAgentPlanData error:", e)
            ElMessage.error('同步雲端資料時發生錯誤')
        } finally {
            isDataReady.value = true
        }
    }

    function importAgentPlanData(data: any) {
        try {
            if (!data || typeof data !== 'object') throw new Error('無效的資料格式')
            const requiredKeys = ['profile', 'career', 'portfolios', 'realEstates']
            const hasAnyKey = requiredKeys.some(key => key in data)
            if (!hasAnyKey) throw new Error('檔案內容不符合財務規劃書格式')
            agentPlan.value = {
                ...getInitialUserPlan(),
                ...data
            }
            if (!loggedInUser.value.uid) {
                clearDatabaseIds(agentPlan.value)
            }
            if (!Array.isArray(agentPlan.value.portfolios)) agentPlan.value.portfolios = []
            if (!Array.isArray(agentPlan.value.realEstates)) agentPlan.value.realEstates = []
            if (!Array.isArray(agentPlan.value.creditCards)) agentPlan.value.creditCards = []
            if (!agentPlan.value.businesses || !Array.isArray(agentPlan.value.businesses.list)) {
                if (Array.isArray(agentPlan.value.businesses)) {
                    agentPlan.value.businesses = {
                        list: agentPlan.value.businesses,
                        total: (agentPlan.value.businesses as any[]).length,
                        currentPage: 1,
                        pageSize: 100,
                        totalPages: 1
                    }
                } else {
                    agentPlan.value.businesses = {
                        list: [], total: 0, currentPage: 1, pageSize: 100, totalPages: 1
                    }
                }
            }
            isDataReady.value = true
            ElMessage.success('財務資料匯入成功！')
        } catch (e: any) {
            console.error('Import failed:', e)
            ElMessage.error(`匯入失敗：${e.message}`)
        }
    }

    return {
        agentPlan,
        loggedInUser,
        isDataReady,
        initAgentListener,
        fetchAgentPlanData,
        importAgentPlanData,
        logout,
        resetAgentPlan
    }
}