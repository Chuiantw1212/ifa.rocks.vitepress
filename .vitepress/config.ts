import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "礪石 IFA 工具箱",
  description: "獨立理財顧問的隨身決策終端。礪石工具箱整合退休計算機與多項財務模擬組件，深度優化手機操作感官，拒絕冗餘干擾。將複雜的生命規劃轉化為觸手可及的精確數據，讓專業建議在指尖即刻產出。",
  head: [
    ['link', { rel: 'icon', href: 'favicon.ico' }],
  ],
  appearance: 'dark',
  lang: 'zh-TW',
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
        text: '輕量快算',
        collapsed: false,
        items: [
          { text: '速算多目標理財規劃', link: '/quick/tvm' },
          { text: '極簡退休缺口試算', link: '/quick/retirement-lite' },
          // { text: '複利與通膨速算', link: '/quick/compound-interest' }
        ]
      },
      // {
      //   text: '底層參數 (盤點現實)',
      //   collapsed: false,
      //   items: [
      //     { text: '家庭結構與相依性', link: '/core/family' },
      //     { text: '收入品質與人力資本', link: '/core/income' }
      //   ]
      // },
      // {
      //   text: '生命里程碑 (試算慾望)',
      //   collapsed: false,
      //   items: [
      //     { text: '購車現金流評估', link: '/milestones/car' },
      //     { text: '購屋與房貸計畫', link: '/milestones/housing' },
      //     { text: '育兒與教育基金', link: '/milestones/education' },
      //     { text: '退休藍圖與提領', link: '/milestones/retirement' }
      //   ]
      // },
      // {
      //   text: '系統檢驗 (收斂變數)',
      //   collapsed: false,
      //   items: [
      //     { text: '資產負債總覽', link: '/overview/balance-sheet' },
      //     { text: '全域壓力測試', link: '/overview/stress-test' }
      //   ]
      // }
    ],
    lastUpdated: {
      text: '上次更新',
      formatOptions: {
        forceLocale: true,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      }
    },
    docFooter: {
      prev: '上一頁',
      next: '下一頁',
    },
    darkModeSwitchLabel: '深色模式',
    sidebarMenuLabel: '選單',
    returnToTopLabel: '回到頂端',
    outline: {
      label: '大綱'
    },
    footer: {
      message: 'Powered by <a href="https://vitepress.dev/" target="_blank">Vitepress</a>',
      copyright: `Copyright © 2023-${new Date().getFullYear()} EN Chu`
    },
    logo: {
      src: '/logo/white_transparent.png',
      width: '24px',
      height: '24px',
    },
    externalLinkIcon: true,
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜尋',
            buttonAriaLabel: '搜尋文件'
          },
          modal: {
            displayDetails: '顯示詳細列表',
            resetButtonTitle: '清除查詢條件',
            backButtonTitle: '返回',
            noResultsText: '無法找到相關結果：',
            footer: {
              selectText: '選擇',
              selectKeyAriaLabel: '按 Enter 鍵選擇',

              navigateText: '切換',
              navigateUpKeyAriaLabel: '按 向上箭頭 鍵往上',
              navigateDownKeyAriaLabel: '按 向下箭頭 鍵往下',

              closeText: '關閉',
              closeKeyAriaLabel: '按 Esc 鍵關閉'
            }
          }
        }
      }
    }
  },
  // Some chunks are larger than 500 kB
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 將大型的 node_modules 依賴包拆分成獨立的 chunk
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'firebase';
              }
              if (id.includes('chart.js')) {
                return 'chart.js';
              }
              if (id.includes('jspdf')) {
                return 'jspdf';
              }
              if (id.includes('html2canvas')) {
                return 'html2canvas';
              }
              // 其他所有來自 node_modules 的依賴包，可以打包成一個 vendor chunk
              return 'vendor';
            }
          }
        }
      }
    }
  }
})
