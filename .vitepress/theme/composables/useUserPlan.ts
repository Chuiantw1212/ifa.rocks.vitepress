import { ref, watch } from 'vue'
import { getAuth, signOut } from "firebase/auth"
import { ElMessage } from 'element-plus'
import { useApi } from './useApi'
import { getInitialUserPlan } from './initialState'
import type { UserPlan, FirebaseUser } from '../types'
import { useAuthStore } from '../stores/auth'

const userPlan = ref<UserPlan>(getInitialUserPlan())
const loggedInUser = ref<FirebaseUser>({
    id: "", uid: "", displayName: "訪客", email: "", photoUrl: "", isAnonymous: true
})
const isDataReady = ref(false)

export function useUserPlan() {
    const { authFetch } = useApi()
    const authStore = useAuthStore()

    function initAuthListener() {
        // 此函式現在改為監聽中央的 auth store，而不是直接監聽 Firebase
        return watch(() => authStore.isInitialized, async (initialized) => {
            if (!initialized) return;

            const firebaseUser = authStore.user;
            if (firebaseUser) {
                // [登入狀態]
                loggedInUser.value = {
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.username,
                    email: firebaseUser.email,
                    photoUrl: firebaseUser.avatarUrl,
                    isAnonymous: false, // 假設都是非匿名登入
                    id: '' // 這個 ID 會在 fetchPlanData 中被後端資料填充
                }
                await fetchPlanData()
            } else {
                // [登出狀態]
                if (loggedInUser.value.uid) {
                    _resetToGuest();
                }
                if (!isDataReady.value) {
                    isDataReady.value = true;
                }
            }
        }, { immediate: true });
    }

    /**
     * 重置表單資料 (Reset Form Data)
     * 用於訪客重置或登出時清空
     */
    function resetUserPlan() {
        userPlan.value = getInitialUserPlan()
    }

    /**
     * 重置為訪客狀態 (登出用)
     * 這裡使用 getInitialUserForm 徹底清空「資料」，回歸初始值
     */
    function _resetToGuest() {
        loggedInUser.value = {
            id: "", uid: "", displayName: "訪客", email: "", photoUrl: "", isAnonymous: true
        }
        // 登出時：徹底清空所有欄位資料
        resetUserPlan()
    }

    async function logout() {
        try {
            isDataReady.value = false
            const auth = getAuth()
            await signOut(auth)

            _resetToGuest()
            ElMessage.success('已安全登出')
        } catch (e: any) {
            console.error('Logout failed', e)
            ElMessage.error('登出失敗')
        } finally {
            setTimeout(() => {
                isDataReady.value = true
            }, 500)
        }
    }

    /**
     * [修正邏輯] 清除資料庫 ID (匯入用)
     * 目的：保留「資料內容」，只移除「ID」以便視為新資料
     */
    function clearDatabaseIds(form: UserPlan) {
        // 單一物件
        if (form.profile) form.profile.id = ""
        if (form.career) form.career.id = ""
        if (form.retirement) form.retirement.id = ""
        if (form.tax) form.tax.id = ""
        if (form.laborInsurance) form.laborInsurance.id = ""
        if (form.laborPension) form.laborPension.id = ""

        // 陣列物件
        form.portfolios?.forEach(i => i.id = "")
        form.realEstates?.forEach(i => i.id = "")
        form.creditCards?.forEach(i => i.id = "")

        // [修正] 商業 (Businesses)
        // 這裡不能清空 list，而是要保留 list 內容，只把裡面的 id 拿掉
        if (form.businesses && Array.isArray(form.businesses.list)) {
            form.businesses.list.forEach(i => i.id = "")
        }
    }

    async function fetchPlanData() {
        try {
            isDataReady.value = false

            // 嘗試取得使用者資料，如果請求失敗 (例如 404 Not Found)，則 .catch 區塊會執行並嘗試建立使用者
            const userRes = await authFetch('/api/v1/user/me').catch(error => {
                console.warn('無法取得使用者資料，嘗試建立新使用者...', error);
                // 如果 GET /user/me 失敗，就呼叫 POST /user/me 來建立。
                // 如果 POST 也失敗，authFetch 內部的錯誤會被拋出，由外層的 catch 捕捉。
                return authFetch('/api/v1/user/me', { method: 'POST' });
            });

            const baseUserData = await userRes.json()

            // [修正] 即使 baseUserData.id 為 null (例如全新使用者)，
            // 仍然需要處理其內部可能存在的資料 (如 tax 物件)。
            // 因此，我們只檢查 baseUserData 是否存在。
            if (baseUserData) {
                // [修正] 採用更安全的合併策略，避免 API 回傳的 null 覆蓋掉前端的初始物件。
                // 如此可以保留 getInitialUserPlan() 產生的 profile: {} 等初始結構，
                // 防止在渲染時出現 'Cannot read properties of null' 的錯誤。
                for (const key in baseUserData) {
                    if (Object.prototype.hasOwnProperty.call(baseUserData, key)) {
                        // 排除由其他 API 呼叫處理的陣列/分頁類型資料
                        if (['portfolios', 'realEstates', 'businesses', 'creditCards'].includes(key)) {
                            continue;
                        }
                        const apiValue = baseUserData[key];
                        // 只有在 API 回傳值不是 null 時才覆蓋
                        if (apiValue !== null && userPlan.value.hasOwnProperty(key)) {
                            (userPlan.value as any)[key] = apiValue;
                        }
                    }
                }
                // 只有在 id 確實存在時才更新
                if (baseUserData.id) {
                    loggedInUser.value.id = String(baseUserData.id)
                }
            }

            const [portfolioRes, realEstateRes, businessesRes, creditCardsRes] = await Promise.all([
                authFetch('/api/v1/user/portfolios'),
                authFetch('/api/v1/user/real-estates'),
                authFetch('/api/v1/user/businesses', { params: { currentPage: 1, pageSize: 100 } }),
                authFetch('/api/v1/user/credit-cards'),
            ])

            if (portfolioRes) {
                const data = await portfolioRes.json()
                if (Array.isArray(data)) userPlan.value.portfolios = data
            }
            if (realEstateRes) {
                const data = await realEstateRes.json()
                if (Array.isArray(data)) userPlan.value.realEstates = data
            }
            if (businessesRes) {
                const data = await businessesRes.json()
                if (data && Array.isArray(data.list)) {
                    userPlan.value.businesses = data
                }
            }
            if (creditCardsRes) {
                const data = await creditCardsRes.json();
                // [修正] 增加對物件結構 { list: [] } 的兼容性
                // 後端 API 可能回傳純陣列或帶有 list 屬性的物件
                if (Array.isArray(data)) {
                    userPlan.value.creditCards = data;
                } else if (data && Array.isArray(data.list)) {
                    userPlan.value.creditCards = data.list;
                }
            }
        } catch (e) {
            console.error("fetchPlanData error:", e)
            ElMessage.error('同步雲端資料時發生錯誤')
        } finally {
            isDataReady.value = true
        }
    }

    function importPlanData(data: any) {
        try {
            if (!data || typeof data !== 'object') throw new Error('無效的資料格式')

            const requiredKeys = ['profile', 'career', 'portfolios', 'realEstates']
            const hasAnyKey = requiredKeys.some(key => key in data)
            if (!hasAnyKey) throw new Error('檔案內容不符合財務規劃書格式')

            // 匯入資料
            userPlan.value = {
                ...getInitialUserPlan(),
                ...data
            }

            // 訪客模式下清除 ID (避免 ID 衝突)
            if (!loggedInUser.value.uid) {
                clearDatabaseIds(userPlan.value)
            }

            // 防呆處理
            if (!Array.isArray(userPlan.value.portfolios)) userPlan.value.portfolios = []
            if (!Array.isArray(userPlan.value.realEstates)) userPlan.value.realEstates = []
            if (!Array.isArray(userPlan.value.creditCards)) userPlan.value.creditCards = []

            // 商業結構防呆
            if (!userPlan.value.businesses || !Array.isArray(userPlan.value.businesses.list)) {
                // 如果匯入的是舊版陣列，嘗試轉型
                if (Array.isArray(userPlan.value.businesses)) {
                    userPlan.value.businesses = {
                        list: userPlan.value.businesses,
                        total: (userPlan.value.businesses as any[]).length,
                        currentPage: 1,
                        pageSize: 100,
                        totalPages: 1
                    }
                } else {
                    // 若無資料，給空物件
                    userPlan.value.businesses = {
                        list: [], total: 0, currentPage: 1, pageSize: 100, totalPages: 1
                    }
                }
            }

            isDataReady.value = true
            ElMessage.success('財務資料匯入成功！')

        } catch (e: any) {
            console.error('Import failed:', e)
            ElMessage.error(`匯入失敗：${e.message}`)
            throw e
        }
    }

    return {
        userPlan,
        loggedInUser,
        isDataReady,
        initAuthListener,
        fetchPlanData,
        importPlanData,
        logout,
        resetUserPlan
    }
}