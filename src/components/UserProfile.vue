<template>
    <el-card shadow="never">
        <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold; font-size: 16px;">基本資料與參數 (Profile)</span>
            </div>
        </template>

        <el-row :gutter="40" align="top">

            <el-col >
                <el-form v-if="userPlan.profile" ref="ruleFormRef" label-position="top" :model="userPlan.profile" size="large">
                    <el-row :gutter="20">

                        <el-col :span="12" :xs="24">
                            <el-form-item label="出生日期 (Birthday)" required>
                                <el-date-picker v-model="userPlan.profile.birthDate" type="date" placeholder="請選擇生日"
                                    format="YYYY/MM/DD" value-format="YYYY-MM-DD" :disabled-date="disableFutureDates"
                                    @change="handleBirthdayChange" style="width: 100%" />
                            </el-form-item>
                        </el-col>

                        
                        <el-col :span="12" :xs="24">
                            <el-form-item label="生理性別 (Gender)" required>
                                <el-select v-model="userPlan.profile.gender" placeholder="請選擇" style="width: 100%"
                                @change="handleUpdate">
                                <el-option v-for="item in metadata?.opt_gender?.list" :key="item.code"
                                :label="item.label" :value="item.code" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    
                    <el-col :span="12" :xs="24">
                        <el-form-item label="試算年齡 (Age)">
                            <el-input :disabled="true" :value="userPlan.profile.currentAge ? userPlan.profile.currentAge + ' 歲' : '-'">
                                <template #prefix>
                                    <el-icon>
                                        <User />
                                    </el-icon>
                                </template>
                            </el-input>
                        </el-form-item>
                    </el-col>
                    </el-row>
                </el-form>
            </el-col>
        </el-row>

        <template #footer>
            <el-collapse accordion>
                <el-collapse-item name="1">
                    <template #title>
                        <el-icon style="margin-right: 5px;">
                            <InfoFilled />
                        </el-icon> 試算參數與資料來源說明
                    </template>
                    <ul style="padding-left: 20px; line-height: 1.8; color: var(--el-text-color-regular);">
                        <li>所有功能不須登入也可以用，登入註冊只是比較方便而已。</li>
                        <li>預期餘命：<el-link type="primary" href="https://data.gov.tw/dataset/39493"
                                target="_blank">國家發展委員會
                                - 預期壽命推估</el-link>
                        </li>
                    </ul>
                </el-collapse-item>
            </el-collapse>
        </template>
    </el-card>
</template>

<script setup lang="ts">
// 之後會在這裡加入邏輯
import { ref, computed } from 'vue'
import { useAgentPlan } from '@/composables/useAgentPlan'
import { useApi } from '@/composables/useApi'
import type { ClientProfile } from '@/types'
import type {UploadFile, UploadInstance, UploadProps, UploadRawFile, UploadUserFile } from 'element-plus'
import { ElMessage, genFileId} from 'element-plus'
import { FirebaseClient } from '@/types'
import { MetadataMap } from '@/types/meta-data'

// 從全域狀態管理取得資料與方法
const { agentPlan: userPlan, loggedInUser, importAgentPlanData: importPlanData } = useAgentPlan()
const { authFetch } = useApi()

// Props
const props = withDefaults(defineProps<{
    user: FirebaseClient
    metadata?: MetadataMap
}>(), {
    user: () => ({
        id: '', uid: '', displayName: '', email: '', photoUrl: '', isAnonymous: true
    }),
    metadata: () => ({})
})

// 直接使用從 useUserPlan() 來的響應式物件
const user = computed(() => loggedInUser.value)

const loginDialogVisible = ref(false)
const isMobile = ref(false)
const fileList = ref<UploadUserFile[]>([])
const uploadRef = ref<UploadInstance>()

// Methods
const avatarText = computed(() => {
    if (!user.value || !user.value.displayName) return '訪'
    return user.value.displayName.charAt(0).toUpperCase()
})

// Handle file exceed
const handleExceed: UploadProps['onExceed'] = (files) => {
    uploadRef.value!.clearFiles()
    const file = files[0] as UploadRawFile
    file.uid = genFileId()
    uploadRef.value!.handleStart(file)
}

// [核心整合] 修改後的 handleFileChange
function handleFileChange(uploadFile: UploadFile) {
    if (!uploadFile.raw) return

    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const result = e.target?.result as string
            const parsedData = JSON.parse(result)

            // 直接呼叫 Composable 的匯入邏輯
            importPlanData(parsedData)

            // 成功後清空檔案列表
            fileList.value = []
        } catch (err) {
            console.error('Import Error', err)
            ElMessage.error('檔案格式錯誤或無法解析')
            fileList.value = []
        }
    }

    reader.onerror = () => {
        ElMessage.error('讀取檔案失敗')
        fileList.value = []
    }

    reader.readAsText(uploadFile.raw)
}

async function handleUpdate() {
    try {
        const res = await authFetch(`/api/v1/client/profile`, {
            method: 'PUT',
            body: userPlan.value.profile,
        })
        if (!res || !res.ok) console.error(`Profile update failed: ${res?.status}`)
    } catch (e) {
        console.error('Profile update error:', e)
    }
}

const disableFutureDates = (time: Date) => {
    return time.getTime() > Date.now()
}

function handleBirthdayChange(val: string | null) {
    if (!userPlan.value.profile) return
    if (!val) {
        userPlan.value.profile.birthDate = ''
        userPlan.value.profile.currentAge = 0
    } else {
        const birthDateObj = new Date(val)
        const today = new Date()
        let age = today.getFullYear() - birthDateObj.getFullYear()
        const monthDifference = today.getMonth() - birthDateObj.getMonth()
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDateObj.getDate())) {
            age--
        }
        userPlan.value.profile.birthDate = val
        userPlan.value.profile.currentAge = age
    }
    handleUpdate()
}
</script>

<style lang="scss" scoped>
.user-profile {
  margin-top: 20px;
}
</style>