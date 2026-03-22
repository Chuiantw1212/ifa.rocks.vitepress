<template>
  <div class="client-crm-container" style="max-width: 1000px; margin: 0 auto; padding: 24px;">

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
                  <el-button type="danger" link icon="Delete">刪除</el-button>
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
import { ref } from 'vue'

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
  contact?: string;
}

// 模擬的全域狀態：目前正在編輯的客戶 ID
const currentClientId = ref<string | null>('c001')

// 彈窗控制
const dialogVisible = ref(false)
const newClientForm = ref<NewClientForm>({ name: '', contact: '' })

// 模擬資料庫中的客戶名單
const clientList = ref<Client[]>([
  { id: 'c001', name: '王大明', status: '資料收集', progress: 40, lastUpdated: '2023-10-25' },
  { id: 'c002', name: '陳美玲', status: '即將提案', progress: 90, lastUpdated: '2023-10-26' },
  { id: 'c003', name: '林志豪', status: '已結案', progress: 100, lastUpdated: '2023-10-20' },
  { id: 'c004', name: '張惠婷', status: '陌生名單', progress: 0, lastUpdated: '2023-10-27' },
])

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

const createNewClient = () => {
  // 模擬新增邏輯
  const newId = `c${String(Date.now()).slice(-4)}`
  clientList.value.push({
    id: newId,
    name: newClientForm.value.name,
    status: '陌生名單',
    progress: 0,
    lastUpdated: getTodayDate()
  })
  dialogVisible.value = false
  currentClientId.value = newId
  console.log('建立成功並自動切換至新客戶')
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