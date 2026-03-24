<template>
  <div class="client-crm-container" style="max-width: 1000px; margin: 0 auto; padding: 24px;">

    <!-- Client Overview & Actions -->
    <el-card shadow="never" style="border-radius: 12px; border: 1px solid #EBEEF5; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <el-row :gutter="32" style="flex-grow: 1;">
          <el-col :xs="12" :sm="6">
            <el-statistic title="陌生名單" :value="statusSummary['陌生名單']" />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-statistic title="資料收集" :value="statusSummary['資料收集']" />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-statistic title="即將提案" :value="statusSummary['即將提案']" />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-statistic title="已結案" :value="statusSummary['已結案']">
              <template #suffix>
                <el-icon style="vertical-align: -0.125em"><Trophy /></el-icon>
              </template>
            </el-statistic>
          </el-col>
        </el-row>
        <el-divider direction="vertical" style="height: 4em; margin: 0 32px;" class="hidden-xs-only" />
        <div style="flex-shrink: 0;" class="hidden-xs-only">
          <el-button type="primary" round :icon="Plus" @click="dialogVisible = true">建立新客戶</el-button>
        </div>
      </div>
    </el-card>

    <!-- Client Card List -->
    <div v-loading="isLoading" style="min-height: 150px;">
      <div v-if="clientList.length > 0" style="display: flex; flex-direction: column; gap: 16px;">
        <el-card v-for="client in clientList" :key="client.id" shadow="hover" style="border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <!-- Info Section -->
              <div style="flex-grow: 1; padding-right: 24px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                  <span style="font-weight: bold; color: #303133; font-size: 18px;">{{ client.name }}</span>
                  <el-tag :type="getStatusType(client.status)" effect="light" round>
                    {{ client.status }}
                  </el-tag>
                </div>
                <div style="max-width: 350px;">
                  <el-text size="small" type="info" style="margin-bottom: 4px; display: block;">理財規劃書進度</el-text>
                  <el-progress 
                    :percentage="client.progress" 
                    :status="client.progress === 100 ? 'success' : ''"
                  />
                </div>
              </div>
              
              <!-- Actions Section -->
              <div style="display: flex; align-items: center; flex-shrink: 0;">
                <el-button
                  type="primary"
                  link
                  style="font-weight: bold;"
                  @click="enterPlan(client)"
                >
                  進入規劃書 👉
                </el-button>
                <el-divider direction="vertical" />
                <el-popconfirm
                  title="確定要刪除這位客戶嗎？"
                  confirm-button-text="確定"
                  cancel-button-text="取消"
                  :icon="Warning"
                  icon-color="#F56C6C"
                  @confirm="deleteClient(client)"
                >
                  <template #reference>
                    <el-button type="danger" link :icon="Delete">刪除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
            <el-divider style="margin: 16px 0;" />
            <div style="display: flex; justify-content: flex-end;">
              <el-text size="small" type="info">最後更新: {{ client.lastUpdated }}</el-text>
            </div>
        </el-card>
      </div>

      <!-- Empty State -->
      <el-card v-else-if="!isLoading" shadow="never" style="border-radius: 12px; border: 1px solid #EBEEF5; text-align: center; padding: 32px 0;">
        <el-empty description="還沒有任何客戶，快來建立第一筆吧！" />
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" title="建立新客戶檔案" width="400px" destroy-on-close>
      <el-form
        ref="ruleFormRef"
        :model="newClientForm"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="客戶姓名" prop="name">
          <el-input v-model="newClientForm.name" placeholder="請輸入姓名" autocomplete="name" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="newClientForm.email" placeholder="請輸入Email" autocomplete="email" />
        </el-form-item>
        <el-form-item label="聯絡電話" prop="phone">
          <el-input v-model="newClientForm.phone" placeholder="選填" autocomplete="tel" />
        </el-form-item>
        <el-form-item label="Line ID" prop="lineId">
          <el-input v-model="newClientForm.lineId" placeholder="選填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createNewClient">建立並進入規劃</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vitepress'
import { Trophy, Plus, Delete, Warning } from '@element-plus/icons-vue'
import { useApi } from '../composables/useApi';
import { useAuthStore } from '../stores/auth';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
// --- 類型定義 ---

type ClientStatus = '陌生名單' | '資料收集' | '即將提案' | '已結案';

interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  progress: number;
  lastUpdated: string;
}

interface NewClientForm {
  name: string;
  email: string;
  phone?: string;
  lineId?: string;
}

// API
const { authFetch } = useApi()
const router = useRouter()
const authStore = useAuthStore()

// 模擬的全域狀態：目前正在編輯的客戶 ID
const currentClientId = ref<string | null>(null)

// 彈窗控制
const dialogVisible = ref(false)
const ruleFormRef = ref<FormInstance>()
const newClientForm = ref<NewClientForm>({ name: '', email: '', phone: '', lineId: '' })

watch(dialogVisible, (isOpening) => {
  if (isOpening) {
    // 每次打開彈窗時重置表單數據
    newClientForm.value = { name: '', email: '', phone: '', lineId: '' }
  }
})

const rules = reactive<FormRules<NewClientForm>>({
  name: [{ required: true, message: '請輸入客戶姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '請輸入Email', trigger: 'blur' },
    { type: 'email', message: '請輸入有效的Email格式', trigger: ['blur', 'change'] }
  ],
  phone: [{ pattern: /^[0-9-+#() ]*$/, message: '請輸入有效的電話號碼', trigger: 'blur' }],
  lineId: [{ pattern: /^[a-zA-Z0-9._-]*$/, message: '請輸入有效的Line ID', trigger: 'blur' }]
})

const isLoading = ref(true)
const clientList = ref<Client[]>([])

const fetchClients = async () => {
  isLoading.value = true
  try {
    const res = await authFetch('/api/v1/clients')
    if (!res.ok) {
      throw new Error(`取得客戶列表失敗 (status: ${res.status})`)
    }
    const data = await res.json()
    clientList.value = data

    if (clientList.value.length > 0 && !currentClientId.value) {
      currentClientId.value = clientList.value[0].id
    }
  } catch (error: any) {
    console.error('Fetch clients error:', error)
    ElMessage.error(error.message || '取得客戶列表時發生未預期的錯誤')
    clientList.value = [] // 發生錯誤時清空列表
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // 監聽 auth store 是否已初始化
  const unwatch = watch(() => authStore.isInitialized, (initialized) => {
    if (initialized) {
      // 初始化完成後，檢查使用者是否登入，然後才擷取客戶資料
      if (authStore.isLoggedIn) {
        fetchClients();
      } else {
        isLoading.value = false; // 如果未登入，也結束載入狀態
      }
      // 停止監聽，這個檢查只需要執行一次
      unwatch();
    }
  }, { immediate: true }); // 使用 immediate: true，如果 store 已初始化，則立即執行
})

// --- Computed Properties ---

const statusSummary = computed(() => {
  const initialSummary: Record<ClientStatus, number> = {
    '陌生名單': 0,
    '資料收集': 0,
    '即將提案': 0,
    '已結案': 0,
  };
  return clientList.value.reduce((summary, client) => {
    summary[client.status]++;
    return summary;
  }, initialSummary);
});

// 狀態對應的顏色標籤
const getStatusType = (status: ClientStatus) => {
  const map: Record<ClientStatus, 'info' | 'warning' | 'primary' | 'success'> = {
    '陌生名單': 'info',
    '資料收集': 'warning',
    '即將提案': 'primary',
    '已結案': 'success'
  }
  return map[status]
}

// 動作邏輯
const handleClientSwitch = (newId: string) => {
  const client = clientList.value.find(c => c.id === newId)
  // 實務上這裡會呼叫 Pinia action: store.setCurrentClient(newId)
  console.log(`全域環境已切換至：${client?.name}`)
}

const enterPlan = async (client: Client) => {
  currentClientId.value = client.id
  await router.go(`/plan/profile`)
}

const createNewClient = async () => {
  const formEl = ruleFormRef.value
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        const res = await authFetch('/api/v1/clients', {
          method: 'POST',
          body: newClientForm.value
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || `建立客戶失敗 (status: ${res.status})`)
        }

        const newClient: Client = await res.json()
        clientList.value.push(newClient)
        currentClientId.value = newClient.id
        dialogVisible.value = false
        ElMessage.success('客戶建立成功')
        console.log('建立成功並自動切換至新客戶')

        // 跳轉到客戶基本資料頁面
        await router.go('/pro/profile')
      } catch (error: any) {
        console.error('Create client error:', error)
        ElMessage.error(error.message || '建立客戶時發生未預期的錯誤')
      }
    } else {
      ElMessage.error('請修正表單中的錯誤後再試一次')
    }
  })
}

const deleteClient = (clientToDelete: Client) => {
  const index = clientList.value.findIndex(c => c.id === clientToDelete.id)
  if (index > -1) {
    clientList.value.splice(index, 1)
    console.log(`客戶 ${clientToDelete.name} 已被刪除`)

    // 如果刪除的是當前正在編輯的客戶
    if (currentClientId.value === clientToDelete.id) {
      // 如果客戶列表不為空，則切換到第一個客戶
      if (clientList.value.length > 0) {
        const newCurrentClient = clientList.value[0]
        currentClientId.value = newCurrentClient.id
        handleClientSwitch(newCurrentClient.id)
      } else {
        // 如果列表空了，就設為 null
        currentClientId.value = null
        console.log('所有客戶都已刪除。')
      }
    }
  }
}
</script>

<style scoped>
/* Scoped styles can be added here if needed */
</style>