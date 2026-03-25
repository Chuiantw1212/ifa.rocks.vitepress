<template>
  <div class="client-crm-container" style="max-width: 1000px; margin: 0 auto; padding: 24px;">

    <!-- Client Overview & Actions -->
    <el-card shadow="never" style="border-radius: 12px; border: 1px solid #EBEEF5; margin-bottom: 24px;">
      <div style="display: flex; justify-content: flex-end; align-items: center;">
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
                <div style="margin-bottom: 16px;">
                  <span style="font-weight: bold; color: #303133; font-size: 18px;">{{ client.name }}</span>
                  <el-text v-if="client.email" type="info" size="small" style="display: block; margin-top: 4px;">{{ client.email }}</el-text>
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
import { storeToRefs } from 'pinia'
import { Trophy, Plus, Delete, Warning } from '@element-plus/icons-vue'
import { useClientsStore, type NewClientForm, type Client } from '@/stores/clients'
import { useAgentStore } from '@/stores/agent'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
// --- 類型定義 ---
// API
const router = useRouter()

// 改為使用集中管理的 Client Store
const clientsStore = useClientsStore()
// 使用 storeToRefs 維持響應性
const { clientList, isLoading, currentClientId } = storeToRefs(clientsStore)

const agentStore =  useAgentStore()

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

// 動作邏輯
const handleClientSwitch = (newId: string | null) => {
  clientsStore.setCurrentClientId(newId)
  // 實務上這裡會呼叫 Pinia action: store.setCurrentClient(newId)
}

const enterPlan = async (client: Client) => {
  clientsStore.setCurrentClientId(client.id)
  await router.go(`/pro/profile`)
}

const createNewClient = async () => {
  const formEl = ruleFormRef.value
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        await clientsStore.createClient(newClientForm.value)
        dialogVisible.value = false
        ElMessage.success('客戶建立成功')

        // 如果 store 成功設定了 currentClientId，則跳轉
        if (clientsStore.currentClientId) {
          await router.go('/pro/profile')
        }
      } catch (error: any) {
        console.error('Create client error:', error)
        ElMessage.error(error.message || '建立客戶時發生未預期的錯誤')
      }
    } else {
      ElMessage.error('請修正表單中的錯誤後再試一次')
    }
  })
}

const deleteClient = async (clientToDelete: Client) => {
  try {
    await clientsStore.deleteClient(clientToDelete.id)
    ElMessage.success(`客戶 ${clientToDelete.name} 已被刪除`)
  } catch (error: any) {
    console.error('Delete client error:', error)
    ElMessage.error(error.message || '刪除客戶時發生未預期的錯誤')
  }
}
</script>

<style scoped>
/* Scoped styles can be added here if needed */
</style>