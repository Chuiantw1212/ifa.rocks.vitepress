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

    <el-dialog v-model="dialogVisible" title="理財規劃系統登入" width="400px" align-center :append-to-body="true">
        <el-form :model="loginForm" label-position="top">
            <el-form-item label="顧問帳號 / 使用者代碼">
                <el-input v-model="loginForm.username" placeholder="請輸入帳號" @keyup.enter="handleLogin" />
            </el-form-item>
            <el-form-item label="訪問密鑰">
                <el-input v-model="loginForm.password" type="password" placeholder="請輸入密鑰" show-password />
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleLogin">
                    進入系統
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'

const dialogVisible = ref(false)
const isLoggedIn = ref(false)

const user = reactive({
    username: '',
    // 這裡未來可以換成從 API 取得的真實頭像 URL
    avatarUrl: computed(() => `https://api.dicebear.com/8.x/adventurer/svg?seed=${user.username}`)
})

const loginForm = reactive({
    username: '',
    password: ''
})

const handleLogin = () => {
    if (!loginForm.username || !loginForm.password) {
        ElMessage.error('帳號與密鑰不可為空')
        return
    }
    // TODO: 這裡未來對接 Neon Serverless Postgres 的 API 驗證
    console.log('正在驗證帳戶:', loginForm.username)
    user.username = loginForm.username
    isLoggedIn.value = true
    ElMessage.success(`歡迎回來，${user.username}`)
    dialogVisible.value = false
}

const handleLogout = () => {
    isLoggedIn.value = false
    loginForm.username = ''
    loginForm.password = ''
    ElMessage.info('您已成功登出')
}
</script>
<style lang="scss" scoped>
.login {
    display: flex;
    align-items: center;
    // margin-left: 16px;
}
</style>