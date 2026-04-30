<template>
  <el-dialog
    :model-value="modelValue"
    title="建立新客戶檔案"
    width="400px"
    destroy-on-close
    @update:model-value="handleDialogClose"
  >
    <el-form
      ref="ruleFormRef"
      :model="formData"
      :rules="rules"
      label-position="top"
    >
      <el-form-item label="客戶姓名" prop="name">
        <el-input v-model="formData.name" placeholder="請輸入姓名" autocomplete="name" />
      </el-form-item>
      <el-form-item label="Email" prop="email">
        <el-input v-model="formData.email" placeholder="請輸入Email" autocomplete="email" />
      </el-form-item>
      <el-form-item label="聯絡電話" prop="phone">
        <el-input v-model="formData.phone" placeholder="選填" autocomplete="tel" />
      </el-form-item>
      <el-form-item label="Line ID" prop="lineId">
        <el-input v-model="formData.lineId" placeholder="選填" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">建立並進入規劃</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { NewClientForm } from '@/stores/clients'

const props = defineProps<{
  modelValue: boolean; // For v-model binding of dialog visibility
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', formData: NewClientForm): void;
  (e: 'cancel'): void;
}>();

const ruleFormRef = ref<FormInstance>();
const formData = reactive<NewClientForm>({ name: '', email: '', phone: '', lineId: '' });

// Watch for modelValue to reset form when dialog opens
watch(() => props.modelValue, (isOpening) => {
  if (isOpening) {
    // Reset form data to default empty values
    Object.assign(formData, { name: '', email: '', phone: '', lineId: '' });
    ruleFormRef.value?.resetFields(); // Reset validation state
  }
});

const rules = reactive<FormRules<NewClientForm>>({
  name: [{ required: true, message: '請輸入客戶姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '請輸入Email', trigger: 'blur' },
    { type: 'email', message: '請輸入有效的Email格式', trigger: ['blur', 'change'] }
  ],
  phone: [{ pattern: /^[0-9-+#() ]*$/, message: '請輸入有效的電話號碼', trigger: 'blur' }],
  lineId: [{ pattern: /^[a-zA-Z0-9._-]*$/, message: '請輸入有效的Line ID', trigger: 'blur' }]
});

const handleDialogClose = (value: boolean) => {
  emit('update:modelValue', value);
};

const handleSubmit = async () => {
  const formEl = ruleFormRef.value;
  if (!formEl) return;

  await formEl.validate(async (valid) => {
    if (valid) {
      emit('submit', { ...formData }); // Emit a copy of formData
    } else {
      ElMessage.error('請修正表單中的錯誤後再試一次');
    }
  });
};

const handleCancel = () => {
  emit('cancel');
  emit('update:modelValue', false); // Close the dialog
};
</script>