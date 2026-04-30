<template>
  <div class="danger-zone-wrapper">
    <p>
      此操作無法復原。這將會永久刪除您的帳號以及所有相關資料，包含您的客戶資料、規劃方案等。
    </p>
    <el-button type="danger" @click="confirmDeleteDialogVisible = true">刪除我的帳號</el-button>
  </div>

  <el-dialog
    v-model="confirmDeleteDialogVisible"
    title="確認刪除帳號"
    width="400px"
    align-center
    :append-to-body="true"
    :destroy-on-close="true"
  >
    <span>您確定要永久刪除您的帳號嗎？所有資料都將被移除且無法復原。</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="confirmDeleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleDeleteAccount" :loading="isDeleting">
          確認刪除
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useAgentStore } from '@/stores/agent';
import { useApi } from '@/composables/useApi';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vitepress';

const agentStore = useAgentStore();
const { authFetch } = useApi();
const router = useRouter();

const confirmDeleteDialogVisible = ref(false);
const isDeleting = ref(false);

const handleDeleteAccount = async () => {
  isDeleting.value = true;

  try {
    const res = await authFetch(`/api/v1/agents`, {
      method: 'DELETE',
    });

    if (res.ok) {
      ElMessage.success('您的帳號已成功刪除。');
      confirmDeleteDialogVisible.value = false;
      await agentStore.logout();
      setTimeout(() => router.go('/'), 1000);
    } else {
      const data = await res.json().catch(() => ({}));
      ElMessage.error(data.message || '刪除帳號失敗，請稍後再試。');
      isDeleting.value = false;
    }
  } catch (error) {
    console.error('Delete account error:', error);
    ElMessage.error('刪除帳號時發生網路錯誤。');
    isDeleting.value = false;
  }
};
</script>

<style scoped>
.danger-zone-wrapper {
  border: 1px solid var(--el-color-danger-light-5);
  background-color: var(--el-color-danger-light-9);
  padding: 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.danger-zone-wrapper p {
  margin: 0;
  padding-right: 20px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}
</style>