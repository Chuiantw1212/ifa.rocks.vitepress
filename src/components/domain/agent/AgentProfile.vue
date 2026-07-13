<template>
  <el-card shadow="never" v-loading="isProfileLoading">
    <template #header>
      <div class="card-header">
        <span>帳號資料</span>
        <el-button class="button" text @click="refreshProfile" :disabled="isProfileLoading">
          <el-icon><Refresh /></el-icon>
          重新整理
        </el-button>
      </div>
    </template>
    <div v-if="agent">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="UID">{{ agent.uid }}</el-descriptions-item>
        <el-descriptions-item label="使用者名稱">{{ agent.username }}</el-descriptions-item>
        <el-descriptions-item label="Email">{{ agent.email }}</el-descriptions-item>
        <el-descriptions-item label="頭像URL">
          <el-link :href="agent.avatarUrl" target="_blank" type="primary">{{ agent.avatarUrl }}</el-link>
        </el-descriptions-item>
        <!-- 以下為後端 API 可能回傳的欄位範例 -->
        <el-descriptions-item v-if="agent.role" label="角色">{{ agent.role }}</el-descriptions-item>
        <el-descriptions-item v-if="agent.createdAt" label="註冊時間">
          {{ new Date(agent.createdAt).toLocaleString() }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
    <el-empty v-else description="無使用者資料" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAgentStore } from '@/stores/agent'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const agentStore = useAgentStore()
const { agent, isProfileLoading } = storeToRefs(agentStore)

async function refreshProfile() {
  if (agent.value) {
    await agentStore.fetchAgentProfile()
    ElMessage.success('顧問資料已更新')
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>