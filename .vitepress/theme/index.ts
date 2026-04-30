import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { createPinia } from 'pinia'

// 1. 引入 Element Plus 核心與基礎樣式
import ElementPlus from 'element-plus'
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'
import 'element-plus/dist/index.css'
/* ⚠️ 注意：我們刻意「不」引入下面這行深色樣式！
  這樣才能在 VitePress 的深色背景下，保持 Element Plus 組件為高對比的白底亮色模式。
  // import 'element-plus/theme-chalk/dark/css-vars.css' 
*/

// 2. 引入您的自定義全域樣式 (包含覆寫 VitePress 原生設定)
import './global.scss'

// // 3. 引入您開發的小計算機與系統模組
// import ClientProfile from '@/components/ClientProfile.vue'
// import ClientDashboard from '@/components/ClientDashboard.vue'
// import RetirementUnderestimationCard from '@/components/RetirementUnderestimationCard.vue'

// // 引入所有速算工具與共用元件
// import TvmCalculator from '@/components/TvmCalculator.vue'
// import PlanningReminder from '@/components/PlanningReminder.vue'
// import RetirementLite from '@/components/RetirementLite.vue'
// import CostOfDelay from '@/components/CostOfDelay.vue'
// import InflationRisk from '@/components/InflationRisk.vue'

// 4. 引入我們集中管理的 Firebase 設定檔
import firebase, { getAnalyticsInstance, getPerformanceInstance } from '@/firebaseConfig';

// 5. 引入核心邏輯層的 Pinia Store
import { useAgentStore } from '@/stores/agent'

// 6. 引入我們統一管理的自訂 Layout
import Layout from './Layout.vue';

export default {
    extends: DefaultTheme,
    Layout,
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
        app.provide(ZINDEX_INJECTION_KEY, { current: 0 })

        // // 全域註冊您的小計算機元件，讓 Markdown 可以直接使用標籤如 <TvmCalculator />
        // app.component('ClientProfile', ClientProfile)
        // app.component('ClientDashboard', ClientDashboard)
        // app.component('RetirementUnderestimationCard', RetirementUnderestimationCard)
        // app.component('TvmCalculator', TvmCalculator)
        // app.component('PlanningReminder', PlanningReminder)
        // app.component('RetirementLite', RetirementLite)
        // app.component('CostOfDelay', CostOfDelay)
        // app.component('InflationRisk', InflationRisk)

        // @ts-ignore
        if (!import.meta.env.SSR) {
            // --- 效能優化：延遲 Firebase 初始化 ---
            // 將 Firebase 相關的初始化（特別是 Auth）延遲到下一個事件循環。
            // 這可以讓 VitePress 的主要內容優先渲染，顯著降低「最大關鍵路徑延遲」，
            // 從而改善 Lighthouse 分數和使用者體感速度，且不會影響功能。
            setTimeout(() => {
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
            }, 0)
        }
    }
}