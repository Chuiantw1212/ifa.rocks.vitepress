<template>
  <div class="client-crm-container" style="max-width: 1000px; margin: 0 auto; padding: 24px;">

    <!-- Client Overview & Actions -->
    <el-card shadow="never" style="border-radius: 12px; border: 1px solid #EBEEF5; margin-bottom: 24px;">
      <div style="display: flex; justify-content: flex-end; align-items: center;">
        <div style="flex-shrink: 0;" class="hidden-xs-only">
          <el-button type="primary" round :icon="Plus" @click="handleCreateClientClick">建立新客戶</el-button>
        </div>
      </div>
    </el-card>

    <!-- Client Card List -->
    <div v-loading="isLoading" style="min-height: 150px;">
      <div v-if="clientList.length > 0" style="display: flex; flex-direction: column; gap: 16px;">
        <ClientCard
          v-for="client in clientList"
          :key="client.id"
          :client="client"
          @enter-plan="enterPlan"
          @edit="handleEditClient"
          @delete="deleteClient"
        />
      </div>

      <!-- Empty State -->
      <el-card v-else-if="!isLoading" shadow="never" style="border-radius: 12px; border: 1px solid #EBEEF5; text-align: center; padding: 32px 0;">
        <el-empty description="還沒有任何客戶，快來建立第一筆吧！" />
      </el-card>
    </div>

    <!-- New Client Dialog Component -->
    <DashboardClientDialog
      v-model="dialogVisible"
      :client-to-edit="clientToEdit"
      @submit="handleDialogSubmit"
      @cancel="handleDialogCancel"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vitepress'
import { storeToRefs } from 'pinia'
import { Trophy, Plus } from '@element-plus/icons-vue'
import { useClientsStore, type NewClientForm, type Client } from '@/stores/clients'
import { useAgentStore } from '@/stores/agent'
import { ElMessage } from 'element-plus'
// Import the new component
import DashboardClientDialog from '../organisms/DashboardClientDialog.vue'
import ClientCard from '../organisms/ClientCard.vue'
// --- 類型定義 ---
// API
const router = useRouter()

// 改為使用集中管理的 Client Store
const clientsStore = useClientsStore()
// 使用 storeToRefs 維持響應性
const { clientList, isLoading, currentClientId } = storeToRefs(clientsStore)

const agentStore =  useAgentStore()

// 彈窗控制
const dialogVisible = ref(false) // This now controls the DashboardClientDialog component
const clientToEdit = ref<Client | null>(null)

// 動作邏輯
const handleClientSwitch = (newId: string | null) => {
  clientsStore.setCurrentClientId(newId)
  // 實務上這裡會呼叫 Pinia action: store.setCurrentClient(newId)
}

const enterPlan = async (client: Client) => {
  clientsStore.setCurrentClientId(client.id)
  await router.go(`/pro/profile?id=${client.id}`)
}

const handleCreateClientClick = () => {
  clientToEdit.value = null
  dialogVisible.value = true
}

const handleEditClient = (client: Client) => {
  clientToEdit.value = client
  dialogVisible.value = true
}

const handleDialogCancel = () => {
  dialogVisible.value = false
  clientToEdit.value = null
}

const handleDialogSubmit = async (formData: NewClientForm) => {
  try {
    if (clientToEdit.value) {
      // Assuming updateClient exists in your store
      await clientsStore.updateClient(clientToEdit.value.id, formData)
      ElMessage.success('客戶資料更新成功')
    } else {
      await clientsStore.createClient(formData)
      ElMessage.success('客戶建立成功')

      // 如果 store 成功設定了 currentClientId，則跳轉
      if (clientsStore.currentClientId) {
        await router.go(`/pro/profile?id=${clientsStore.currentClientId}`)
      }
    }
    handleDialogCancel() // Close dialog and reset state
  } catch (error: any) {
    const action = clientToEdit.value ? '更新' : '建立'
    console.error(`${action} client error:`, error)
    ElMessage.error(error.message || `${action}客戶時發生未預期的錯誤`)
  }
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