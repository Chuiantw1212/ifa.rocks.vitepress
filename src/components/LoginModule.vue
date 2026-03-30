<template>
    <!-- 等待驗證狀態初始化完成後再渲染，避免閃爍 -->
    <el-space v-if="agentStore.isInitialized" class="login" :size="20" alignment="center" direction="horizontal">
        <!-- 登入後顯示使用者頭像與下拉選單 -->
        <el-dropdown v-if="isLoggedIn" trigger="click" @command="handleCommand">
            <el-avatar :size="32" :src="agent.avatarUrl" :alt="agent.username" aria-label="使用者選單" />
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item command="account">帳號管理</el-dropdown-item>
                    <el-dropdown-item command="logout" divided>登出系統</el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <!-- 未登入時顯示可點擊的登入頭像 -->
        <el-avatar v-else :size="32" :icon="UserFilled" @click="dialogVisible = true" aria-label="登入或註冊" />
    </el-space>

    <el-dialog v-model="dialogVisible" title="理財規劃系統登入" width="400px" align-center :append-to-body="true" :destroy-on-close="true">
        <!-- FirebaseUI 將會在這個容器中渲染 -->
        <div id="firebaseui-auth-container"></div>
    </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue';
import { useRouter } from 'vitepress';
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { auth } from '@/firebaseConfig'
import { GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { useAgentStore } from '@/stores/agent';

const dialogVisible = ref(false)

const agentStore = useAgentStore()

// 使用 computed 屬性來響應 store 的變化
const isLoggedIn = computed(() => agentStore.isLoggedIn)
const agent = computed(() => agentStore.agent || { username: '', avatarUrl: '' })

const router = useRouter();

// 監聽來自 store 的登入成功狀態，以關閉對話框
watch(() => agentStore.isLoggedIn, (loggedIn, wasLoggedIn) => {
    if (loggedIn && !wasLoggedIn && dialogVisible.value) {
        dialogVisible.value = false
        ElMessage.success(`歡迎回來，${agentStore.agent.username}`)
    }
})

// 監看 dialogVisible 的變化，當它被打開時，啟動 FirebaseUI
watch(dialogVisible, (newValue) => {
    if (newValue) { // 當對話框打開時
        const launchFirebaseUI = () => {
            // 使用 nextTick 確保 #firebaseui-auth-container 已被渲染到 DOM 中
            nextTick(() => {
                // 取得或建立 FirebaseUI 實例
                const ui = window.firebaseui.auth.AuthUI.getInstance() || new window.firebaseui.auth.AuthUI(auth);
                const uiConfig = {
                    callbacks: {
                        // 我們不需要在這裡做任何事，因為 Pinia store 中的 onAuthStateChanged
                        // 監聽器會統一處理使用者狀態。
                        // 返回 false 可以避免登入後頁面重新導向。
                        signInSuccessWithAuthResult: (authResult, redirectUrl) => false,
                    },
                    signInFlow: 'popup',
                    signInOptions: [
                        GoogleAuthProvider.PROVIDER_ID,
                        {
                            provider: EmailAuthProvider.PROVIDER_ID,
                            // 明確指定我們就是要走傳統的密碼登入路線
                            signInMethod: 'password', 
                            // 如果你的註冊流程不需要強迫使用者填寫暱稱，可以設為 false 減少摩擦
                            requireDisplayName: false 
                        },
                    ],
                };
                // 在指定的容器中啟動 FirebaseUI
                ui.start('#firebaseui-auth-container', uiConfig);
            });
        };

        // 檢查 UI 腳本是否已載入
        if (window.firebaseui) {
            launchFirebaseUI();
        } else {
            // 如果尚未載入，則動態建立 script 標籤來載入它
            const script = document.createElement('script');
            script.src = '/firebase/firebase-ui-auth__zh_tw.js';
            script.async = true;
            script.onload = launchFirebaseUI; // 載入成功後，啟動 UI
            script.onerror = () => {
                console.error('Failed to load firebase-ui-auth__zh_tw.js');
                ElMessage.error('登入模組腳本載入失敗');
            };
            document.head.appendChild(script);
        }
    }
});

const handleLogout = async () => {
    try {
        await agentStore.logout()
        ElMessage.info('您已成功登出')
    } catch (error) {
        console.error('Logout Error:', error)
        ElMessage.error('登出時發生錯誤')
    }
};

const handleCommand = (command) => {
    switch (command) {
        case 'account':
            router.go('/pro/account');
            break;
        case 'logout':
            handleLogout();
            break;
    }
}
</script>
<style lang="scss" scoped>
.login {
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-left: 16px;
}
</style>