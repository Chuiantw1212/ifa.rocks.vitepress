import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { defineComponent, h, onMounted } from 'vue'
import { createPinia } from 'pinia'

// 1. 引入 Element Plus 核心與基礎樣式
import ElementPlus from 'element-plus'
import { ID_INJECTION_KEY } from 'element-plus'
import 'element-plus/dist/index.css'
/* ⚠️ 注意：我們刻意「不」引入下面這行深色樣式！
  這樣才能在 VitePress 的深色背景下，保持 Element Plus 組件為高對比的白底亮色模式。
  // import 'element-plus/theme-chalk/dark/css-vars.css' 
*/

// 2. 引入您的自定義全域樣式 (包含覆寫 VitePress 原生設定)
import './global.scss'

// 3. 引入您開發的小計算機與系統模組
import LoginModule from '@/components/LoginModule.vue'
import ClientProfile from '@/components/ClientProfile.vue'
import ClientDashboard from '@/components/ClientDashboard.vue'
import RetirementUnderestimationCard from '@/components/RetirementUnderestimationCard.vue'

// 引入所有速算工具與共用元件
import TvmCalculator from '@/components/TvmCalculator.vue'
import PlanningReminder from '@/components/PlanningReminder.vue'
import RetirementLite from '@/components/RetirementLite.vue'
import CostOfDelay from '@/components/CostOfDelay.vue'
import InflationRisk from '@/components/InflationRisk.vue'

// 4. 引入我們集中管理的 Firebase 設定檔
import firebase, { getAnalyticsInstance, getPerformanceInstance } from '@/firebaseConfig'
import { useAgent } from '@/composables/useAgent'

// 5. 引入核心邏輯層的 Pinia Store
import { useAgentStore } from '@/stores/agent'
import { useDynamicSidebar } from '@/composables/useDynamicSidebar'

export default {
    extends: DefaultTheme,

    // 佈局擴充：處理 Navbar、Sidebar 等特定位置的插槽
    Layout: defineComponent({
        setup() {
            // 在 Layout 中初始化 Agent (顧問) 的狀態監聽器。
            const { initAgentListener } = useAgent()
            onMounted(() => {
                initAgentListener()
            })

            // 這個 Composable 會設定監聽器，自動更新側邊欄連結
            useDynamicSidebar()

            return () => h(DefaultTheme.Layout, null, {
                'nav-bar-content-after': () => h(LoginModule)
            })
        }
    }),

    // 擴充 Vue 實體：全域註冊套件與自定義元件
    enhanceApp({ app }: EnhanceAppContext) {
        // 註冊 Pinia
        const pinia = createPinia()
        app.use(pinia)

        // 註冊 Element Plus
        app.use(ElementPlus)

        // 為 SSR 提供 ID，以確保水合 (hydration) 過程成功
        app.provide(ID_INJECTION_KEY, {
            prefix: Math.floor(Math.random() * 10000),
            current: 0,
        })

        // 全域註冊您的小計算機元件，讓 Markdown 可以直接使用標籤如 <TvmCalculator />
        app.component('ClientProfile', ClientProfile)
        app.component('ClientDashboard', ClientDashboard)
        app.component('RetirementUnderestimationCard', RetirementUnderestimationCard)
        app.component('TvmCalculator', TvmCalculator)
        app.component('PlanningReminder', PlanningReminder)
        app.component('RetirementLite', RetirementLite)
        app.component('CostOfDelay', CostOfDelay)
        app.component('InflationRisk', InflationRisk)

        // @ts-ignore
        if (!import.meta.env.SSR) {
            // 這是啟動 Firebase 驗證監聽的最佳位置。
            // 它只會在客戶端執行一次，且在 Pinia store 建立之後。
            const agentStore = useAgentStore()
            agentStore.init()

            // @ts-ignore
            if (!window.firebase) {
                 // @ts-ignore
                 window.firebase = firebase
            }

            // 安全地在客戶端初始化需要瀏覽器 API 的服務
            getAnalyticsInstance();
            getPerformanceInstance();
        }
    }
}