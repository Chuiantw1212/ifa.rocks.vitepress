import { defineConfig } from 'vitepress'
import path from 'path'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "礪石 IFA 工具箱",
  description: "獨立理財顧問的隨身決策終端。礪石工具箱整合退休計算機與多項財務模擬組件，深度優化手機操作感官，拒絕冗餘干擾。將複雜的生命規劃轉化為觸手可及的精確數據，讓專業建議在指尖即刻產出。",
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    // 從本地 public 資料夾載入 FirebaseUI 的 CSS
    [
      'link',
      {
        type: 'text/css',
        rel: 'stylesheet',
        href: '/firebase/firebase-ui-auth.css'
      }
    ]
  ],
  appearance: 'force-dark',
  lang: 'zh-TW',
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: '快速試算',
        link: '/quick/multi-goals',
        // 使用正規表達式，確保只要在 /quick/ 路徑下，此 Nav 就會保持高亮
        activeMatch: '^/quick/'
      },
      {
        text: '客戶總覽 (CRM)', // 新增：SaaS 系統的真正首頁
        link: '/pro/dashboard/',     // 指向我們剛討論的 ClientDashboard 頁面
        activeMatch: '^/dashboard/'
      },
    ],
    // 2. 多側邊欄 (Multi-Sidebar) 配置
    // 注意：這裡必須是 Object，以路徑作為 Key
    // 注意：這裡必須是 Object，以路徑作為 Key
    sidebar: {

      // 當網址進入 /pro/ 開頭時，左側會「完全切換」為以下目錄
      '/pro/': [
        // 💡 核心 UX 改造：給顧問一條明確的退路
        {
          text: '🔙 返回客戶總覽 (切換客戶)',
          link: '/dashboard/',
        },
        // ⬇️ 以下為您規劃的 CFP 標準 5 大篇章 ⬇️
        {
          text: '壹、家庭財務摘要',
          collapsed: false,
          items: [
            { text: '個案背景摘要', link: '/pro/summary' },
            { text: '客戶基本資料', link: '/pro/profile' }
          ]
        },
        {
          text: '貳、財務現況診斷',
          collapsed: false,
          items: [
            { text: '資產負債現況', link: '/pro/balance-sheet' },
            { text: '年度收支明細', link: '/pro/cash-flow' }, // 👉 我們討論的「自由買斷天數」會放在這裡
            { text: '保險保障評估', link: '/pro/insurance-analysis' },
            { text: '財務比率診斷', link: '/pro/financial-ratios' }
          ]
        },
        {
          text: '參、目標需求分析',
          collapsed: false,
          items: [
            { text: '目標優先序與時間軸', link: '/pro/goals-timeline' },
            { text: '現金流量模擬測試', link: '/pro/cash-flow-sim' }
          ]
        },
        {
          text: '肆、專屬規劃建議',
          collapsed: true, // 預設摺疊，減輕視覺壓力
          items: [
            { text: '資產配置優化方案', link: '/pro/asset-allocation' },
            { text: '稅務優化與贈與', link: '/pro/tax-planning' },
            { text: '傳承與信託規劃', link: '/pro/trust-legacy' }
          ]
        },
        {
          text: '伍、效益與執行計畫',
          collapsed: true,
          items: [
            { text: '整體效益評估', link: '/pro/benefit-analysis' },
            { text: '執行計畫與時程', link: '/pro/execution-plan' },
            { text: '📑 產出最終規劃書', link: '/pro/generate-report' } // 建議加上這個匯出節點
          ]
        }
      ],

      // 當網址進入 /quick/ 開頭時，左側會「完全切換」為輕量工具目錄
      '/quick/': [
        {
          text: '輕量快算工具 (免註冊)',
          items: [
            { text: '多目標財務規劃', link: '/quick/multi-goals' },
            { text: '簡易退休規劃', link: '/quick/retirement' },
            { text: '代價計時器', link: '/quick/cost-of-delay' },
            { text: '通膨照妖鏡', link: '/quick/inflation-risk' }
          ]
        }
      ],

      // 當網址進入 /about/ 開頭時的側邊欄
      '/about/': [
        {
          text: '服務說明',
          items: [
            { text: '顧問責任與義務', link: '/about/responsibility' },
            { text: '定期檢視機制', link: '/about/review' }
          ]
        }
      ]
    },
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
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../'),
      }
    },
  }
})
