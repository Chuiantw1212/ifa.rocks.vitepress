import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { auth } from '../firebaseConfig'
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth'

// 為了程式碼清晰，定義使用者物件的型別
export interface AuthUser {
    uid: string;
    username: string;
    email: string | null;
    avatarUrl: string;
}

export const useAuthStore = defineStore('auth', () => {
    // --- State ---
    const user = ref<AuthUser | null>(null)
    // 這個旗標用來追蹤 Firebase 的初始驗證狀態是否已確認
    const isInitialized = ref(false)

    // --- Getters ---
    const isLoggedIn = computed(() => !!user.value)

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
                // 使用者已登入
                user.value = {
                    uid: firebaseUser.uid,
                    username: firebaseUser.displayName || firebaseUser.email || '使用者',
                    email: firebaseUser.email,
                    avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/8.x/adventurer/svg?seed=${firebaseUser.uid}`
                }
                if (import.meta.env.DEV) {
                    console.log(`[AuthStore] 使用者 ${user.value.username} 於 ${new Date().toLocaleString()} 登入。`);
                }
            } else {
                // 使用者已登出
                user.value = null
            }

            // 在第一次狀態確認後，將 isInitialized 設為 true
            if (!isInitialized.value) {
                isInitialized.value = true;
                console.log('[AuthStore] 驗證狀態已初始化。');
            }
        });
    }

    async function logout() {
        await signOut(auth);
    }

    return { user, isInitialized, isLoggedIn, init, logout }
})