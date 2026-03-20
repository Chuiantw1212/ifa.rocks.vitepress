import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { h } from 'vue'

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
import LoginModule from './components/LoginModule.vue'
// import TvmCalculator from './components/TvmCalculator.vue' // 等 TVM 開發完後取消註解
// import AssetLiability from './components/AssetLiability.vue' // 等資產負債表開發完後取消註解

// 4. 引入我們集中管理的 Firebase 設定檔
import firebase, { getAnalyticsInstance, getPerformanceInstance } from './firebaseConfig'

export default {
    extends: DefaultTheme,

    // 佈局擴充：處理 Navbar、Sidebar 等特定位置的插槽
    Layout() {
        return h(DefaultTheme.Layout, null, {
            // 將「登入報告系統」按鈕放置於導航欄右上角
            'nav-bar-content-after': () => h(LoginModule)
        })
    },

    // 擴充 Vue 實體：全域註冊套件與自定義元件
    enhanceApp({ app }: EnhanceAppContext) {
        // 註冊 Element Plus
        app.use(ElementPlus)

        // 為 SSR 提供 ID，以確保水合 (hydration) 過程成功
        app.provide(ID_INJECTION_KEY, {
            prefix: Math.floor(Math.random() * 10000),
            current: 0,
        })

        // 全域註冊您的小計算機元件，讓 Markdown 可以直接使用標籤如 <TvmCalculator />
        // app.component('TvmCalculator', TvmCalculator)
        // app.component('AssetLiability', AssetLiability)

        // @ts-ignore
        if (!import.meta.env.SSR) {
            // 關鍵：手動將 firebase 掛載到 window 物件
            // 這是讓 head 中載入的 firebase-ui-auth__zh_tw.js 能運作的絕對關鍵。
            // 因為 firebaseConfig.ts 在被 import 時就已經執行過初始化，
            // 這裡只需確保 window.firebase 這個全域變數存在即可。
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