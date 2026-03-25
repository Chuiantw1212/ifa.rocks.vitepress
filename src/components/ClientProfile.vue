<template>
    <el-card shadow="never">
        <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold; font-size: 16px;">基本資料與參數 (Profile)</span>
            </div>
        </template>

        <el-row :gutter="40" align="top">

            <el-col >
                <el-form v-if="clientPlan.profile" ref="ruleFormRef" label-position="top" :model="clientPlan.profile" size="large">
                    <el-row :gutter="20">

                        <el-col :span="12" :xs="24">
                            <el-form-item label="出生日期 (Birthday)" required>
                                <el-date-picker v-model="clientPlan.profile.birthDate" type="date" placeholder="請選擇生日"
                                    format="YYYY/MM/DD" value-format="YYYY-MM-DD" :disabled-date="disableFutureDates"
                                    @change="handleBirthdayChange" style="width: 100%" />
                            </el-form-item>
                        </el-col>

                        
                        <el-col :span="12" :xs="24">
                            <el-form-item label="生理性別 (Gender)" required>
                                <el-select v-model="clientPlan.profile.gender" placeholder="請選擇" style="width: 100%"
                                @change="handleUpdate">
                                <el-option v-for="item in metadata?.opt_gender?.list" :key="item.code"
                                :label="item.label" :value="item.code" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    
                    <el-col :span="12" :xs="24">
                        <el-form-item label="試算年齡 (Age)">
                            <el-input :disabled="true" :value="clientPlan.profile.currentAge ? clientPlan.profile.currentAge + ' 歲' : '-'">
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vitepress'
import { storeToRefs } from 'pinia'
import { useAgentPlan } from '@/composables/useAgentPlan'
import { useApi } from '@/composables/useApi'
import { useClientsStore } from '@/stores/clients'
import { useMetadataStore } from '@/stores/metadata'
import type {UploadFile, UploadInstance, UploadProps, UploadRawFile, UploadUserFile } from 'element-plus'
import { ElMessage, genFileId} from 'element-plus'
import { InfoFilled, User } from '@element-plus/icons-vue'
import { FirebaseClient } from '@/types'
import { MetadataMap } from '@/types/meta-data'

// 從全域狀態管理取得資料與方法
const { agentPlan: clientPlan, loggedInUser, importAgentPlanData: importPlanData } = useAgentPlan()
const { authFetch } = useApi()
const clientsStore = useClientsStore()
const metadataStore = useMetadataStore()
const { currentClientId, isLoading: isClientsLoading } = storeToRefs(clientsStore)
const { metadata } = storeToRefs(metadataStore)
const route = useRoute()
const router = useRouter()

async function fetchProfile(clientId: string) {
    if (!clientPlan.value) return;
    try {
        const res = await authFetch(`/api/v1/client-profiles/${clientId}`);
        const data = await res.json();
        if (res.ok) {
            clientPlan.value.profile = data;
        } else {
            ElMessage.error(data.message || '取得客戶基本資料失敗');
            clientPlan.value.profile = null;
        }
    } catch (e) {
        console.error('Fetch profile error:', e);
        ElMessage.error('取得客戶基本資料時發生錯誤');
        if (clientPlan.value) clientPlan.value.profile = null;
    }
}

onMounted(() => {
    const handleRouteChange = () => {
        const newId = new URL(window.location.href).searchParams.get('id');

        // 重新整理頁面時，等到客戶列表載入完成後才設定 currentClientId，
        // 避免其他地方 watch currentClientId 時，因 clientList 尚未載入而找不到對應的客戶資料，導致錯誤。
        if (isClientsLoading.value && newId) {
            const unwatch = watch(isClientsLoading, (loading) => {
                if (!loading) {
                    handleRouteChange(); // 載入完成後，重新執行一次
                    unwatch();
                }
            });
            return;
        }

        const clientExists = newId ? clientsStore.clientList.some(c => c.id === newId) : false;

        if (newId && clientExists) {
            // 確認 ID 存在於列表中，才進行設定和資料獲取
            clientsStore.setCurrentClientId(newId);
            fetchProfile(newId);
        } else if (newId && !isClientsLoading.value) {
            // 列表已載入，但找不到來自 URL 的 client ID，這可能是個無效/過期的連結
            console.warn(`Client with ID ${newId} not found in client list after loading.`);
            ElMessage.error('找不到指定的客戶資料，可能已被刪除或連結已失效。');
            if (clientPlan.value) clientPlan.value.profile = null;
            clientsStore.setCurrentClientId(null);
        } else {
            if (clientPlan.value) {
                clientPlan.value.profile = null;
            }
            clientsStore.setCurrentClientId(null);
        }
    }

    router.onAfterRouteChanged = handleRouteChange;
    handleRouteChange(); // 首次載入時執行
});

// Props
const props = withDefaults(defineProps<{
    user: FirebaseClient
}>(), {
    user: () => ({
        id: '', uid: '', displayName: '', email: '', photoUrl: '', isAnonymous: true
    })
})

// 直接使用從 useAgentPlan() 來的響應式物件
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
    if (!currentClientId.value) {
        console.warn('無法更新 Profile：尚未選擇任何客戶 (currentClientId is null)。')
        // 在沒有選擇客戶的情況下，不進行後端更新。
        return
    }
    try {
        const res = await authFetch(`/api/v1/client-profiles/${currentClientId.value}`, {
            method: 'PATCH',
            body: clientPlan.value.profile,
        })
        if (!res || !res.ok) {
            console.error(`Profile update failed: ${res?.status}`)
            ElMessage.error('更新基本資料失敗')
        }
    } catch (e) {
        console.error('Profile update error:', e)
        ElMessage.error('更新基本資料時發生錯誤')
    }
}

const disableFutureDates = (time: Date) => {
    return time.getTime() > Date.now()
}

function handleBirthdayChange(val: string | null) {
    if (!clientPlan.value.profile) return
    if (!val) {
        clientPlan.value.profile.birthDate = ''
        clientPlan.value.profile.currentAge = 0
    } else {
        const birthDateObj = new Date(val)
        const today = new Date()
        let age = today.getFullYear() - birthDateObj.getFullYear()
        const monthDifference = today.getMonth() - birthDateObj.getMonth()
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDateObj.getDate())) {
            age--
        }
        clientPlan.value.profile.birthDate = val
        clientPlan.value.profile.currentAge = age
    }
    handleUpdate()
}
</script>

<style lang="scss" scoped>
.user-profile {
  margin-top: 20px;
}
</style>