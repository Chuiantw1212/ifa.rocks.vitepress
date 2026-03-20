<template>
    <el-space class="login" :size="20" alignment="center" direction="horizontal">
        <!-- 登入後顯示使用者頭像與下拉選單 -->
        <el-dropdown v-if="isLoggedIn" trigger="click">
            <el-avatar :size="32" :src="user.avatarUrl" />
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item disabled>{{ user.username }}</el-dropdown-item>
                    <el-dropdown-item divided @click="handleLogout">登出系統</el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <!-- 未登入時顯示可點擊的登入頭像 -->
        <el-avatar v-else :size="32" :icon="UserFilled" @click="dialogVisible = true" style="cursor: pointer;" />
    </el-space>

    <el-dialog v-model="dialogVisible" title="理財規劃系統登入" width="400px" align-center :append-to-body="true" :destroy-on-close="true">
        <!-- FirebaseUI 將會在這個容器中渲染 -->
        <div id="firebaseui-auth-container"></div>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
// 假設您的 Firebase 設定檔位於 .vitepress/theme/firebaseConfig.js
import { auth } from '../firebaseConfig'
import { onAuthStateChanged, signOut, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth'

const dialogVisible = ref(false)
const isLoggedIn = ref(false)

const user = reactive({
    username: '',
    avatarUrl: ''
})

// FirebaseUI instance
let ui = null;

onMounted(() => {
    // 監聽 Firebase 身份驗證狀態的變化
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            // 使用者已登入
            isLoggedIn.value = true
            user.username = firebaseUser.displayName || firebaseUser.email || '使用者'
            // 優先使用 Firebase 提供的頭像，若無則使用 DiceBear 作為備用
            user.avatarUrl = firebaseUser.photoURL || `https://api.dicebear.com/8.x/adventurer/svg?seed=${firebaseUser.uid}`
            
            // 登入成功後關閉對話框並顯示歡迎訊息
            if (dialogVisible.value) {
                dialogVisible.value = false
                ElMessage.success(`歡迎回來，${user.username}`)
            }
        } else {
            // 使用者已登出
            isLoggedIn.value = false
            user.username = ''
            user.avatarUrl = ''
        }
    })

    onBeforeUnmount(() => {
        // 元件銷毀時，取消監聽
        unsubscribe()
    })
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
                        signInSuccessWithAuthResult: () => false, // 返回 false，讓 onAuthStateChanged 統一處理後續
                    },
                    signInFlow: 'popup',
                    signInOptions: [
                        GoogleAuthProvider.PROVIDER_ID,
                        EmailAuthProvider.PROVIDER_ID,
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

const handleLogout = () => {
    signOut(auth).then(() => {
        ElMessage.info('您已成功登出')
    }).catch((error) => {
        console.error('Logout Error:', error)
        ElMessage.error('登出時發生錯誤')
    })
}
</script>
<style lang="scss" scoped>
.login {
    display: flex;
    align-items: center;
    // margin-left: 16px;
}
</style>