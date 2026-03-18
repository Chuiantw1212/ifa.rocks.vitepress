import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "礪石 IFA 工具箱",
  description: "獨立理財顧問的隨身決策終端。礪石工具箱整合退休計算機與多項財務模擬組件，深度優化手機操作感官，拒絕冗餘干擾。將複雜的生命規劃轉化為觸手可及的精確數據，讓專業建議在指尖即刻產出。",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
