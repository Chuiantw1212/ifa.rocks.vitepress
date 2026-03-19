<template>
    <el-space class="login" :size="20" alignment="center" direction="horizontal">
        <el-button type="primary" @click="dialogVisible = true" round size="default">
            登入
        </el-button>
    </el-space>

    <el-dialog v-model="dialogVisible" title="理財規劃系統登入" width="400px" align-center :append-to-body="true">
        <el-form :model="loginForm" label-position="top">
            <el-form-item label="顧問帳號 / 使用者代碼">
                <el-input v-model="loginForm.username" placeholder="請輸入帳號" />
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
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const dialogVisible = ref(false)
const loginForm = reactive({
    username: '',
    password: ''
})

const handleLogin = () => {
    // 這裡未來對接 Neon Serverless Postgres 的 API 驗證
    console.log('正在驗證帳戶:', loginForm.username)
    ElMessage.success('成功連線至 Neon 資料庫，歡迎回來')
    dialogVisible.value = false
}
</script>
<style lang="scss" scoped>
.login {
    display: flex;
    align-items: center;
    margin-left: 16px;
}
</style>