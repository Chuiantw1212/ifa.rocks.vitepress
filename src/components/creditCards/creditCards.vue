<template>
    <el-space direction="vertical" fill size="large" style="width: 100%">

        <el-empty v-if="!creditCards || creditCards.length === 0" description="尚未配置信用卡金流">
            <el-button type="primary" :icon="Plus" @click="addCard">
                新增金流配置
            </el-button>
        </el-empty>

        <el-card v-for="(item, index) in creditCards" :key="item.id || `cc-${index}`" shadow="never">
            <el-form label-position="top">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <el-icon :size="20">
                            <CreditCard />
                        </el-icon>
                        <span style="font-weight: bold; font-size: 16px;">
                            {{ item.name || `信用卡 ${index + 1}` }}
                        </span>

                        <el-tag v-if="item.usageType" :type="getUsageMeta(item.usageType)?.color || 'info'"
                            effect="light" round size="small">
                            {{ getUsageMeta(item.usageType)?.label || item.usageType }}
                        </el-tag>
                    </div>
                    <el-button type="danger" plain circle :icon="Delete" size="small"
                        @click="removeCard(index, item)" />
                </div>

                <el-divider style="margin: 12px 0;" />

                <el-row :gutter="20">
                    <el-col :span="12" :xs="24">
                        <el-form-item label="卡片名稱">
                            <el-input v-model="item.name" placeholder="例：富邦 J 卡" @change="handleUpdate(item)" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :xs="24">
                        <el-form-item label="連結扣款帳戶">
                            <el-input v-model="item.deductionAccount" placeholder="例：台新 Richart (薪轉)"
                                @change="handleUpdate(item)" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12" :xs="24">
                        <el-form-item label="主要資金用途">
                            <el-select v-model="item.usageType" placeholder="請選擇" style="width: 100%"
                                @change="handleUpdate(item)">
                                <el-option v-for="opt in usageOptions" :key="opt.code" :label="opt.label"
                                    :value="opt.code">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span>{{ opt.label }}</span>
                                        <span v-if="opt.desc" style="color: #909399; font-size: 12px;">{{ opt.desc
                                            }}</span>
                                    </div>
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :xs="24">
                        <el-form-item label="實體/數位狀態">
                            <el-radio-group v-model="item.storageLocation"
                                @change="handleUpdate(item)">
                                <el-radio-button label="wallet" style="flex: 1; text-align: center;">
                                    <el-tooltip content="隨身攜帶 (低摩擦)" placement="top">
                                        <span>{{ STORAGE_ICONS.wallet }} 錢包</span>
                                    </el-tooltip>
                                </el-radio-button>
                                <el-radio-button label="digital" style="flex: 1; text-align: center;">
                                    <el-tooltip content="僅數位綁定 (中摩擦)" placement="top">
                                        <span>{{ STORAGE_ICONS.digital }} 數位</span>
                                    </el-tooltip>
                                </el-radio-button>
                                <el-radio-button label="drawer" style="flex: 1; text-align: center;">
                                    <el-tooltip content="抽屜/保險箱 (高摩擦)" placement="top">
                                        <span>{{ STORAGE_ICONS.drawer }} 抽屜</span>
                                    </el-tooltip>
                                </el-radio-button>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12" :xs="24">
                        <el-form-item label="平均月消費">
                            <el-input-number v-model="item.averageMonthlyExpense" :step="1000" style="width: 100%"
                                controls-position="right" placeholder="輸入金額" @change="handleUpdate(item)" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :xs="24">
                        <el-form-item label="- 年化預估支出">
                            <el-text tag="b" type="info" size="large">
                                {{ formatCurrency((item.averageMonthlyExpense || 0) * 12) }}
                            </el-text>
                        </el-form-item>
                    </el-col>
                </el-row>

            </el-form>
        </el-card>

        <el-button v-if="creditCards && creditCards.length > 0" type="primary" plain :icon="Plus"
            style="width: 100%; margin-top: 8px; border-style: dashed;" @click="addCard">
            新增金流配置
        </el-button>

    </el-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, CreditCard } from '@element-plus/icons-vue'
import { useCreditCardsStore } from '@/stores/creditCards'
import { useMetadataStore } from '@/stores/metadata'
import type { ClientCreditCard } from '@/types/client-credit-card'

const creditCardsStore = useCreditCardsStore()
const { creditCards } = storeToRefs(creditCardsStore)

const metadataStore = useMetadataStore()
const { metadata } = storeToRefs(metadataStore)

const usageOptions = computed(() => metadata.value?.opt_credit_card_usage_type?.list || [])

const STORAGE_ICONS = {
    wallet: '💳',
    digital: '📱',
    drawer: '🗄️',
}

const getUsageMeta = (code: string) => {
    return usageOptions.value.find(opt => opt.code === code)
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number') return '-'
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

const addCard = async () => {
    const newCardData: Omit<ClientCreditCard, 'id' | 'clientId' | 'firebaseUid' | 'createdAt' | 'updatedAt'> = {
        name: '',
        deductionAccount: '',
        usageType: '',
        storageLocation: 'wallet',
        averageMonthlyExpense: 0,
    }
    try {
        await creditCardsStore.createCreditCard(newCardData)
    } catch (error) {
        // 錯誤已在 store 中處理
        console.error('Failed to add card:', error)
    }
}

const removeCard = (index: number, item: ClientCreditCard) => {
    ElMessageBox.confirm(
        `確定要刪除信用卡 「${item.name || `信用卡 ${index + 1}`}」 嗎？此操作無法復原。`,
        '確認刪除',
        {
            confirmButtonText: '確定刪除',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(async () => {
        if (item.id) {
            try {
                await creditCardsStore.deleteCreditCard(item.id)
            } catch (error) {
                // 錯誤已在 store 中處理
            }
        } else {
            creditCards.value.splice(index, 1)
            ElMessage.info('已移除未儲存的卡片')
        }
    }).catch(() => {
        ElMessage.info('已取消刪除')
    })
}

const handleUpdate = async (item: ClientCreditCard) => {
    if (!item.id) {
        console.warn('Attempted to update a card without an ID. This should be a create operation.', item)
        return
    }
    try {
        await creditCardsStore.updateCreditCard(item.id, item)
    } catch (error) {
        // 錯誤已在 store 中處理
    }
}
</script>