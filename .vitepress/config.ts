import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "礪石 IFA 工具箱",
  description: "獨立理財顧問的隨身決策終端。礪石工具箱整合退休計算機與多項財務模擬組件，深度優化手機操作感官，拒絕冗餘干擾。將複雜的生命規劃轉化為觸手可及的精確數據，讓專業建議在指尖即刻產出。",
  // appearance: 'dark',
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: '輕量快算 (破冰與演示)',
        collapsed: false,
        items: [
          { text: '單點財務計算機 (TVM)', link: '/quick/tvm' },
          { text: '極簡退休缺口試算', link: '/quick/retirement-lite' },
          { text: '複利與通膨速算', link: '/quick/compound-interest' }
        ]
      },
      {
        text: '底層參數 (盤點現實)',
        collapsed: false,
        items: [
          { text: '家庭結構與相依性', link: '/core/family' },
          { text: '收入品質與人力資本', link: '/core/income' }
        ]
      },
      {
        text: '生命里程碑 (試算慾望)',
        collapsed: false,
        items: [
          { text: '購車現金流評估', link: '/milestones/car' },
          { text: '購屋與房貸計畫', link: '/milestones/housing' },
          { text: '育兒與教育基金', link: '/milestones/education' },
          { text: '退休藍圖與提領', link: '/milestones/retirement' }
        ]
      },
      {
        text: '系統檢驗 (收斂變數)',
        collapsed: false,
        items: [
          { text: '資產負債總覽', link: '/overview/balance-sheet' },
          { text: '全域壓力測試', link: '/overview/stress-test' }
        ]
      }
    ],
  }
})
