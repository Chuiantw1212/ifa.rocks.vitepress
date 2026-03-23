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
                <el-text size="small" type="secondary" style="margin-bottom: 4px; display: block;">理財規劃書進度</el-text>
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
                icon="Warning"
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
    <el-card v-else shadow="never" style="border-radius: 12px; border: 1px solid #EBEEF5; text-align: center; padding: 32px 0;">
      <el-empty description="還沒有任何客戶，快來建立第一筆吧！" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="建立新客戶檔案" width="400px" destroy-on-close>
      <el-form :model="newClientForm" label-position="top">
        <el-form-item label="客戶姓名">
          <el-input v-model="newClientForm.name" placeholder="請輸入姓名" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="newClientForm.email" placeholder="請輸入Email" />
        </el-form-item>
        <el-form-item label="聯絡電話/Line ID">
          <el-input v-model="newClientForm.contact" placeholder="選填" />
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
import { ref, computed } from 'vue'
import { Trophy, Plus, Delete } from '@element-plus/icons-vue'
import { useApi } from '../composables/useApi'
import { ElMessage } from 'element-plus'
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
  email:string;
  contact?: string;
}

// API
const { authFetch } = useApi()

// 模擬的全域狀態：目前正在編輯的客戶 ID
const currentClientId = ref<string | null>('c001')

// 彈窗控制
const dialogVisible = ref(false)
const newClientForm = ref<NewClientForm>({ name: '', email:'', contact: '' })

// 模擬資料庫中的客戶名單
const clientList = ref<Client[]>([
  { id: 'c001', name: '王大明', status: '資料收集', progress: 40, lastUpdated: '2023-10-25' },
  { id: 'c002', name: '陳美玲', status: '即將提案', progress: 90, lastUpdated: '2023-10-26' },
  { id: 'c003', name: '林志豪', status: '已結案', progress: 100, lastUpdated: '2023-10-20' },
  { id: 'c004', name: '張惠婷', status: '陌生名單', progress: 0, lastUpdated: '2023-10-27' },
])

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

const getTodayDate = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 動作邏輯
const handleClientSwitch = (newId: string) => {
  const client = clientList.value.find(c => c.id === newId)
  // 實務上這裡會呼叫 Pinia action: store.setCurrentClient(newId)
  console.log(`全域環境已切換至：${client?.name}`)
}

const enterPlan = (client: Client) => {
  currentClientId.value = client.id
  // 實務上這裡會搭配 Vue Router: router.push(`/plan/profile`)
  console.log(`進入 ${client.name} 的理財規劃書...`)
}

const createNewClient = async () => {
  if (!newClientForm.value.name || !newClientForm.value.email) {
    ElMessage.warning('客戶姓名與 Email 為必填欄位')
    return
  }

  try {
    const res = await authFetch('/api/v1/user', {
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
    newClientForm.value = { name: '', email: '', contact: '' }
    ElMessage.success('客戶建立成功')
    console.log('建立成功並自動切換至新客戶')
  } catch (error: any) {
    console.error('Create client error:', error)
    ElMessage.error(error.message || '建立客戶時發生未預期的錯誤')
  }
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