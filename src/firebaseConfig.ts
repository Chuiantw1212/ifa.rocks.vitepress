// .vitepress/theme/firebaseConfig.ts
// 1. 引入 Firebase 套件
// 引入相容性套件 (compat) 是為了讓舊版 firebase-ui-auth.js 腳本可以運作
import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'

// 引入模組化套件 (modular) 是為了在 Vue 元件中享有更現代、更輕量的 API
import { getAuth } from 'firebase/auth'
import { Analytics, getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'
import { FirebasePerformance, getPerformance, isSupported as isPerformanceSupported } from 'firebase/performance'

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
    if (!analyticsInstance) {
        // isSupported() 是 Firebase 官方推薦的檢查方式，比 typeof window 更穩健
        isAnalyticsSupported().then((supported) => {
            if (supported) {
                analyticsInstance = getAnalytics(app);
            }
        })
    }
    return analyticsInstance;
}

let performanceInstance: FirebasePerformance | undefined;
let isPerformanceInitialized = false;

/**
 * 以非同步方式延遲初始化並取得 Firebase Performance 實例。
 * 此函式對初始載入時間和 SEO 的影響降至最低。
 * 它只在首次被呼叫時載入效能監控腳本，且僅在正式環境中執行。
 *
 * @returns 一個 Promise，在正式環境中會解析為 FirebasePerformance 實例，在開發環境中則為 undefined。
 */
export const getPerformanceInstance = async (): Promise<FirebasePerformance | undefined> => {
    if (isPerformanceInitialized) {
        return performanceInstance;
    }

    isPerformanceInitialized = true; // 立刻標記，防止重複進入

    if (import.meta.env.PROD) {
        // 在正式環境，非同步地載入真實模組，使其脫離初始打包檔案
        if (await isPerformanceSupported()) {
            await import('firebase/compat/performance'); // 為了相容舊的 `firebase.performance()` 呼叫
            performanceInstance = getPerformance(app);
            console.log('Firebase Performance Monitoring 已在此會話中啟用。');
        }
    } else {
        // 在開發環境，提供一個模擬物件以防止出錯，但不載入任何腳本
        console.log('Firebase Performance Monitoring 在開發環境中已停用。');
        (firebase as any).performance = () => ({ trace: () => ({ start: () => {}, stop: () => {} }) });
    }

    return performanceInstance;
}

// 5. 預設匯出相容性 (v8) 的 firebase 物件 (供 theme/index.ts 掛載到 window)
export default firebase;