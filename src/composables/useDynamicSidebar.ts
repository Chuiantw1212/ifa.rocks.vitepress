import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useClientsStore } from '@/stores/clients'
import { inBrowser, useRoute } from 'vitepress'

/**
 * A composable that dynamically updates sidebar links to include the current client's ID.
 */
export function useDynamicSidebar() {
    if (!inBrowser) return

    const clientsStore = useClientsStore()
    const { currentClientId } = storeToRefs(clientsStore)
    const route = useRoute()

    const updateSidebarLinks = (clientId: string | null) => {
        // 使用 requestAnimationFrame 確保我們在 DOM 更新後執行
        requestAnimationFrame(() => {
            const sidebar = document.querySelector('.VPSidebar')
            if (!sidebar) return

            const links = sidebar.querySelectorAll('a.VPLink')

            links.forEach(link => {
                const a = link as HTMLAnchorElement
                // 使用 data- 屬性來儲存原始、乾淨的路徑，避免重複修改
                const originalPath = a.dataset.originalPath || a.pathname
                if (!a.dataset.originalPath) {
                    a.dataset.originalPath = a.pathname
                }

                // 只修改 /pro/ 路徑下且非 dashboard 的連結
                if (originalPath.startsWith('/pro/') && !originalPath.includes('/dashboard')) {
                    if (clientId) {
                        a.href = `${originalPath}?id=${clientId}`
                    } else {
                        a.href = originalPath
                    }
                }
            })
        })
    }

    // 監聽 client ID 和路由的變化，以便隨時更新連結
    watch(currentClientId, updateSidebarLinks, { immediate: true })
    watch(() => route.path, () => updateSidebarLinks(currentClientId.value))
}