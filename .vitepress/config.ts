import { defineConfig } from 'vitepress'
import * as path from 'path'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "鍛石 IFA 工具箱",
  description: "鍛石 IFA 工具箱是專為獨立顧問打造的隨身決策終端。透過開源邏輯降解複雜的金融變數，讓專業建議在指尖即刻產出。我們優化行動端操作，支持多目標試算與專業報表一鍵直送，協助您在諮詢現場以數據建立信任，讓專業回歸尊嚴。",
  head: [
    // --- SEO & Performance Optimization ---
    // 1. Preconnect to Google Fonts domains to speed up font loading.
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' }
    ],
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
    ],
    // 2. Asynchronously load Google Fonts to prevent render-blocking.
    [
      'link',
      {
        rel: 'preload',
        as: 'style',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&display=swap',
        onload: "this.onload=null;this.rel='stylesheet'"
      }
    ],
    // 3. Provide a fallback for browsers that do not support preload.
    ['noscript', {}, `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&display=swap">`],

    ['link', { rel: 'icon', href: '/favicon.ico' }],
    // 從本地 public 資料夾載入 FirebaseUI 的 CSS
    [
      'link',
      {
        // 將 rel="stylesheet" 改為 rel="preload"，並指定 as="style"
        // 這樣瀏覽器會優先下載，但不會阻礙頁面渲染
        rel: 'preload',
        as: 'style',
        type: 'text/css',
        href: '/firebase/firebase-ui-auth.css',
        // 在樣式表載入完成後，透過 onload 事件將其應用於頁面
        onload: "this.onload=null;this.rel='stylesheet'"
      }
    ]
  ],
  appearance: 'force-dark',
  lang: 'zh-TW',
  lastUpdated: true,
  cleanUrls: true,
  sitemap: {
    hostname: 'https://ifa.rocks',
    transformItems(items) {
      // 僅保留 articles/ 目錄下的檔案與首頁
      return items.filter((item) => item.url === '' || item.url === 'index.html' || item.url.includes('articles/'))
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: '財商專欄',
        link: '/articles/financial-advisor-comparison-rm-broker-ifa',
        activeMatch: '^/articles/'
      },
      {
        text: '互動教學',
        link: '/quick/inflation-risk',
        // 使用正規表達式，確保只要在 /quick/ 路徑下，此 Nav 就會保持高亮
        activeMatch: '^/quick/'
      },
      {
        text: 'IFA規劃書', // 新增：SaaS 系統的真正首頁
        link: '/pro/dashboard/',     // 指向我們剛討論的 ClientDashboard 頁面
        activeMatch: '^/pro/dashboard/'
      },
    ],
    // 2. 多側邊欄 (Multi-Sidebar) 配置
    // 注意：這裡必須是 Object，以路徑作為 Key
    sidebar: {
      '/articles/': [
        {
          text: '財商專欄',
          items: [
            {
              text: '綜合',
              collapsed: false,
              items: [
                { text: '理專、保經、IFA 差在哪？', link: '/articles/financial-advisor-comparison-rm-broker-ifa' }
              ]
            },
            {
              text: '記帳&現金流',
              collapsed: false,
              items: [
                { text: '記帳自動化：發票存摺', link: '/articles/minimalist-finance-automation-invoice-passbook' },
                { text: '保費快繳不出來了怎辦？', link: '/articles/reduced-paid-up-vs-extended-term' }
              ]
            },
            {
              text: '投資',
              collapsed: false,
              items: [
                { text: 'ETF vs 基金，哪個好？', link: '/articles/etf-vs-fund-total-expense-ratio-buffett-bet' },
                { text: '投資型保險=財富碎紙機', link: '/articles/investment-linked-insurance-trap' },
                { text: '終極懶人ETF', link: '/articles/ishares-core-allocation-etf-beginner-guide' },
              ]
            },
            {
              text: '保險',
              collapsed: false,
              items: [
                { text: '終身壽險 vs 贈與稅真相', link: '/articles/savings-insurance-vs-inheritance-tax-truth' },
                { text: '儲蓄保險的通膨陷阱', link: '/articles/why-savings-insurance-is-losing-to-inflation' }
              ]
            },
             {
              text: '買房',
              collapsed: false,
              items: [
                { text: '買房還是租房(一)：槓桿篇', link: '/articles/buy-vs-rent-asset-scale-logic' },
                { text: '買房還是租房(二)：通膨篇', link: '/articles/buy-vs-rent-inflation-subscription-trap' },
                { text: '買房還是租房(三)：生活篇', link: '/articles/buy-vs-rent-opportunity-cost-tax-logic' },
              ]
            },
            {
              text: '退休',
              collapsed: false,
              items: [
                { text: '勞工退休金一次領還是月領？', link: '/articles/labor-pension-lump-sum-vs-monthly' },
                { text: '高息ETF vs 年金險', link: '/articles/retirement-fund-etf-vs-annuity-comparison' }
              ]
            },
          ]
        }
      ],

      // 當網址進入 /pro/ 開頭時，左側會「完全切換」為以下目錄
      '/pro/': [
        {
          text: '🔙 返回客戶總覽',
          link: '/pro/dashboard/'
        },
        // ==========================================
        // 👤 階段零：系統的計算地基
        // ==========================================
        {
          text: '👤 關於用戶',
          collapsed: false,
          items: [
            // 獨立意義：換算出「距離退休還剩幾次發薪日」與「家庭責任基準」
            { text: '基本資料與餘命', link: '/pro/profile' }
          ]
        },
      ],

      // 當網址進入 /quick/ 開頭時，左側會「完全切換」為輕量工具目錄
      '/quick/': [
        {
          text: '互動教學',
          items: [
            {
              text: '收支',
              collapsed: false,
              items: [
                { text: '通膨照妖鏡', link: '/quick/inflation-risk' },
                { text: '代價計時器', link: '/quick/cost-of-delay' },
              ]
            },
            {
              text: '退休',
              collapsed: false,
              items: [
                { text: '簡易退休規劃', link: '/quick/retirement' },
              ]
            },
            {
              text: '綜合',
              collapsed: false,
              items: [
                { text: '多目標財務規劃', link: '/quick/multi-goals' },
              ]
            },
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
      copyright: `Copyright © 2023-${new Date().getFullYear()} EN Chu | <a href="/privacy">隱私權政策</a>`
    },
    logo: {
      src: '/logo/white_transparent_36.webp',
      width: '24px',
      height: '24px',
    },
    externalLinkIcon: true,
    search: {
      provider: 'local',
      options: {
        _render(src, env, md) {
          // 只針對 articles 目錄下的檔案進行搜尋索引
          if (env.relativePath && !env.relativePath.startsWith('articles/')) return ''
          return md.render(src, env)
        },
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
    // socialLinks: [
    //   { ariaLabel: 'github', icon: 'github', link: 'https://github.com/Chuiantw1212/ifa.rocks.vitepress' },
    // ],
  },
  // Some chunks are larger than 500 kB
  vite: {
    build: {
      sourcemap: false,
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
        // 設定別名，指向你建立的 src 目錄
        '@': path.resolve(__dirname, '../src'),
      }
    },
  }
})
