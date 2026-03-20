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

// Scripts
import firebase from 'firebase/compat/app'
import "firebase/compat/performance";

const firebaseConfig = {
    apiKey: "AIzaSyD6nHPPxRBPZN1b0pfKGNh6L3mn45bpBCM",
    authDomain: "ifa-rocks.firebaseapp.com",
    projectId: "ifa-rocks",
    storageBucket: "ifa-rocks.firebasestorage.app",
    messagingSenderId: "899902006292",
    appId: "1:899902006292:web:584c4930a39f7beec67301",
    measurementId: "G-W25J1NE4SP"
};

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
            console.log('Not SSR - Initializing Firebase Compat')

            const firebaseConfig = {
                apiKey: "AIzaSyADacfSXAMQ3XLIho3-xvzhb04_YcHQ1Vc",
                authDomain: "enchu-8085a.firebaseapp.com",
                projectId: "enchu-8085a",
                storageBucket: "enchu-8085a.firebasestorage.app",
                messagingSenderId: "592400229145",
                appId: "1:592400229145:web:858fc1199d18601dc25b88",
                measurementId: "G-9860DS47Z6"
            }

            // 避免重複初始化 (Hot Reload 時可能會發生)
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig)

                // 啟動效能監控
                firebase.performance()

                // 2. 關鍵修正：手動將 firebase 掛載到 window 物件
                // 這是讓 firebase-ui-auth__zh_tw.js 能運作的絕對關鍵
                // @ts-ignore
                window.firebase = firebase

                console.log('Firebase globally attached to window.firebase')
            } else {
                // 如果已經初始化過，也要確保 window上有掛載 (針對 HMR 情境)
                // @ts-ignore
                if (!window.firebase) {
                    // @ts-ignore
                    window.firebase = firebase
                }
            }
        }
    }
}