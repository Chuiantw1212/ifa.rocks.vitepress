import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css' // 支援深色模式
import { h } from 'vue'
import LoginModule from './components/LoginModule.vue'

export default {
    extends: DefaultTheme,
    Layout() {
        return h(DefaultTheme.Layout, null, {
            // 使用 nav-bar-content-after 插槽放置在搜尋框右側
            'nav-bar-content-after': () => h(LoginModule)
        })
    },
    enhanceApp({ app }: EnhanceAppContext) {
        app.use(ElementPlus)
    }
}