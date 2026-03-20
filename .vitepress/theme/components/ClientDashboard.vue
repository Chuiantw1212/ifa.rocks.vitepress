<template>
  <div class="client-crm-container" style="max-width: 1000px; margin: 0 auto; padding: 24px;">
    
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding: 16px 24px; background-color: #fff; border-radius: 12px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-avatar size="small" style="background-color: #409EFF;">IF</el-avatar>
        <span style="font-weight: bold; color: #303133;">王牌顧問的控制台</span>
      </div>
      
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-text type="info" size="small">目前編輯：</el-text>
        <el-select 
          v-model="currentClientId" 
          placeholder="選擇客戶" 
          style="width: 200px;"
          @change="handleClientSwitch"
        >
          <el-option 
            v-for="client in clientList" 
            :key="client.id" 
            :label="client.name" 
            :value="client.id"
          >
            <span style="float: left">{{ client.name }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px">{{ client.status }}</span>
          </el-option>
        </el-select>
      </div>
    </div>

    <el-card shadow="never" style="border-radius: 12px; border: 1px solid #EBEEF5;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 18px; font-weight: bold; color: #303133;">📁 我的客戶名單</span>
          <el-button type="primary" round icon="Plus" @click="dialogVisible = true">
            建立新客戶
          </el-button>
        </div>
      </template>

      <el-table :data="clientList" style="width: 100%" stripe>
        <el-table-column prop="name" label="客戶姓名" width="120" fixed>
          <template #default="scope">
            <span style="font-weight: bold; color: #303133;">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="目前狀態" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="light" round size="small">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="理財規劃書進度" min-width="200">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 12px;">
              <el-progress 
                :percentage="scope.row.progress" 
                :status="scope.row.progress === 100 ? 'success' : ''"
                style="flex: 1;"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="lastUpdated" label="最後更新" width="120" />

        <el-table-column label="操作" width="150" align="right" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              link 
              style="font-weight: bold;"
              @click="enterPlan(scope.row)"
            >
              進入規劃書 👉
            </el-button>
          </template>
        </el-table-column>
      </el-table>
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

<script setup>
import { ref } from 'vue'

// 模擬的全域狀態：目前正在編輯的客戶 ID
const currentClientId = ref('c001')

// 彈窗控制
const dialogVisible = ref(false)
const newClientForm = ref({ name: '', contact: '' })

// 模擬資料庫中的客戶名單
const clientList = ref([
  { id: 'c001', name: '王大明', status: '資料收集', progress: 40, lastUpdated: '2023-10-25' },
  { id: 'c002', name: '陳美玲', status: '即將提案', progress: 90, lastUpdated: '2023-10-26' },
  { id: 'c003', name: '林志豪', status: '已結案', progress: 100, lastUpdated: '2023-10-20' },
  { id: 'c004', name: '張惠婷', status: '陌生名單', progress: 0, lastUpdated: '2023-10-27' },
])

// 狀態對應的顏色標籤
const getStatusType = (status) => {
  const map = {
    '陌生名單': 'info',
    '資料收集': 'warning',
    '即將提案': 'primary',
    '已結案': 'success'
  }
  return map[status] || 'info'
}

// 動作邏輯
const handleClientSwitch = (newId) => {
  const client = clientList.value.find(c => c.id === newId)
  // 實務上這裡會呼叫 Pinia action: store.setCurrentClient(newId)
  console.log(`全域環境已切換至：${client.name}`)
}

const enterPlan = (client) => {
  currentClientId.value = client.id
  // 實務上這裡會搭配 Vue Router: router.push(`/plan/profile`)
  console.log(`進入 ${client.name} 的理財規劃書...`)
}

const createNewClient = () => {
  // 模擬新增邏輯
  const newId = `c00${clientList.value.length + 1}`
  clientList.value.push({
    id: newId,
    name: newClientForm.value.name,
    status: '陌生名單',
    progress: 0,
    lastUpdated: '今日'
  })
  dialogVisible.value = false
  currentClientId.value = newId
  console.log('建立成功並自動切換至新客戶')
}
</script>

<style scoped>
/* 讓表格列在 hover 時有點微小的互動感 */
:deep(.el-table__row) {
  cursor: pointer;
  transition: background-color 0.3s;
}
</style>