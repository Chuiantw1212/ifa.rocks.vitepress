import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { ElMessage } from 'element-plus'
import type { MetadataMap } from '@/types/meta-data'

export const useMetadataStore = defineStore('metadata', () => {
    const { authFetch } = useApi()

    const metadata = ref<MetadataMap | null>(null)
    const isLoading = ref(false)

    async function fetchMetadata() {
        isLoading.value = true
        try {
            const res = await authFetch('/api/v1/metadata')
            if (!res.ok) {
                throw new Error(`取得 Metadata 失敗 (status: ${res.status})`)
            }
            const data = await res.json()
            metadata.value = data
        } catch (error: any) {
            console.error('Fetch metadata error:', error)
            ElMessage.error(error.message || '取得系統參數時發生錯誤')
            metadata.value = null
        } finally {
            isLoading.value = false
        }
    }

    return { metadata, isLoading, fetchMetadata }
})