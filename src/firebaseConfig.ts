// .vitepress/theme/firebaseConfig.ts

// 1. 引入 Firebase 套件
// 引入相容性套件 (compat) 是為了讓舊版 firebase-ui-auth.js 腳本可以運作
import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import 'firebase/compat/performance'

// 引入模組化套件 (modular) 是為了在 Vue 元件中享有更現代、更輕量的 API
import { getAuth } from 'firebase/auth'
import { Analytics, getAnalytics } from 'firebase/analytics'
import { FirebasePerformance, getPerformance } from 'firebase/performance'

// 2. 唯一的 Firebase 設定來源 (Single Source of Truth)
// !! 注意：我在您的 index.ts 中發現了兩組不同的設定。
// !! 請在此處填入您專案「正確」的那一組設定。
// 我將使用您檔案中位於上方的 ifa-rocks 設定作為範例。
export const firebaseConfig = {
    apiKey: "AIzaSyD6nHPPxRBPZN1b0pfKGNh6L3mn45bpBCM",
    authDomain: "ifa-rocks.firebaseapp.com",
    projectId: "ifa-rocks",
    storageBucket: "ifa-rocks.firebasestorage.app",
    messagingSenderId: "899902006292",
    appId: "1:899902006292:web:584c4930a39f7beec67301",
    measurementId: "G-W25J1NE4SP"
};

// 3. 初始化 Firebase App (只執行一次)
// 為了讓 firebase-ui 能運作，我們使用 compat 的 initializeApp
// 同時也避免在 Hot Reload 時重複初始化
let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app(); // if already initialized, use that one
}

// 4. 匯出模組化 (v9) 的服務 (供 Vue 元件使用)
// Auth 服務本身在初始化時是 SSR 安全的，可以直接匯出
export const auth = getAuth(app);

// Analytics 和 Performance 強烈依賴瀏覽器環境，我們將其初始化延遲，
// 僅在客戶端確定需要時才調用。
let analyticsInstance: Analytics;
export const getAnalyticsInstance = () => {
    // 加上 typeof window !== 'undefined' 作為雙重保險
    if (typeof window !== 'undefined' && !analyticsInstance) {
        analyticsInstance = getAnalytics(app);
    }
    return analyticsInstance;
}

let performanceInstance: FirebasePerformance;
export const getPerformanceInstance = () => {
    if (typeof window !== 'undefined' && !performanceInstance) {
        performanceInstance = getPerformance(app);
    }
    return performanceInstance;
}

// 5. 預設匯出相容性 (v8) 的 firebase 物件 (供 theme/index.ts 掛載到 window)
export default firebase;