import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { auth } from '../firebaseConfig'
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth'

// 為了程式碼清晰，定義 Agent (顧問) 物件的型別
export interface Agent {
    uid: string;
    username: string;
    email: string | null;
    avatarUrl: string;
}

export const useAgentStore = defineStore('agent', () => {
    // --- State ---
    const agent = ref<Agent | null>(null)
    // 這個旗標用來追蹤 Firebase 的初始驗證狀態是否已確認
    const isInitialized = ref(false)

    // --- Getters ---
    const isLoggedIn = computed(() => !!agent.value)

    // --- Actions ---
    let unsubscribe: (() => void) | null = null;

    /**
     * 初始化 Firebase 驗證狀態監聽器。
     * 這個動作應該在應用程式啟動時被呼叫一次。
     */
    function init() {
        if (unsubscribe) return; // 防止重複初始化

        unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // 顧問已登入
                agent.value = {
                    uid: firebaseUser.uid,
                    username: firebaseUser.displayName || firebaseUser.email || '顧問',
                    email: firebaseUser.email,
                    avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/8.x/adventurer/svg?seed=${firebaseUser.uid}`
                }
            } else {
                // 顧問已登出
                agent.value = null
            }

            // 在第一次狀態確認後，將 isInitialized 設為 true
            if (!isInitialized.value) {
                isInitialized.value = true;
            }
        });
    }

    async function logout() {
        await signOut(auth);
    }

    return { agent, isInitialized, isLoggedIn, init, logout }
})