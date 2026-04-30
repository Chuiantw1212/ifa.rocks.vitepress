<template>
  <el-card shadow="hover" style="border-radius: 12px;">
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
          @click="emit('enter-plan', client)"
        >
          進入規劃書
        </el-button>
      </div>
    </div>
    <el-divider style="margin: 16px 0;" />
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <el-button type="primary" link :icon="Edit" @click="emit('edit', client)">修改</el-button>
        <el-popconfirm
          title="確定要刪除這位客戶嗎？"
          confirm-button-text="確定"
          cancel-button-text="取消"
          :icon="Warning"
          icon-color="#F56C6C"
          @confirm="emit('delete', client)"
        >
          <template #reference>
            <el-button type="danger" link :icon="Delete" style="margin-left: 8px;">刪除</el-button>
          </template>
        </el-popconfirm>
      </div>
      <el-text size="small" type="info">最後更新: {{ client.lastUpdated }}</el-text>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Delete, Warning, Edit } from '@element-plus/icons-vue'
import type { Client } from '@/stores/clients'

defineProps<{ client: Client }>()

const emit = defineEmits<{
  (e: 'enter-plan', client: Client): void
  (e: 'delete', client: Client): void
  (e: 'edit', client: Client): void
}>()
</script>