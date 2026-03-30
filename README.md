# 礪石 IFA 工具箱 (ifa.rocks)

**專為獨立理財顧問 (IFA) 打造的隨身決策終端。**

## 線上預覽

您可以透過以下網址訪問線上版本：
[https://ifa.rocks/](https://ifa.rocks/)

## 核心理念

此專案旨在收斂複雜的財務變數，將專業的財務規劃流程化、視覺化。我們相信，最好的工具應該是顧問專業能力的延伸，而非束縛。因此，本專案圍繞以下核心理念打造：

*   **決策導向**：捨棄複雜線條，只提供直覺好懂的財富曲線，讓客戶在諮詢現場瞬間看懂財務風險。
*   **行動優先**：專為行動諮詢設計，優化手機端的滑動操作感，讓顧問在咖啡廳的零碎對談中，也能優雅地執行專業財務建模。
*   **零摩擦體驗**：從快速試算到專業報告產出，力求在最少的點擊內完成，讓技術成為助力，而非阻力。

## 主要功能

*   **客戶儀表板**: 統一管理所有客戶，進度一目了然。
*   **輕量快算工具**:
    *   多目標財務規劃
    *   簡易退休規劃
    *   代價計時器 (機會成本)
    *   通膨照妖鏡 (實際購買力)
*   **長壽風險分析**: 視覺化呈現傳統退休規劃年期的低估風險。
*   **SaaS 整合**: 透過 Firebase Authentication 實現安全的顧問登入與客戶資料隔離。
*   **資料自主權**: 我們賦予使用者完整的資料自主權，使用者可隨時透過介面永久刪除其帳號及所有相關資料，無需聯繫管理員。

## 技術棧

*   **前端框架**: Vue 3
*   **文件與網站生成**: VitePress
*   **UI 元件庫**: Element Plus
*   **狀態管理**: Pinia
*   **後端驗證**: Firebase Authentication
*   **後端 API**: Google Cloud Run

## 相關專案

*   **後端 API 程式碼庫**: [ifa.rocks.spring](https://github.com/Chuiantw1212/ifa.rocks.spring)


## 專案結構

```
├── .vitepress/              # VitePress 設定檔 (config, theme)
├── public/                  # 靜態資源 (logo, robots.txt)
├── src/
│   ├── components/          # Vue 元件 (計算機、卡片等)
│   ├── composables/         # 可組合的 Vue 函式 (useApi, useAgent)
│   ├── stores/              # Pinia 狀態管理 (agent, clients)
│   └── firebaseConfig.ts    # Firebase 與環境變數設定中心
└── package.json             # 專案依賴與腳本
```

## 開始使用

### 環境變數

本專案透過 `package.json` 中的 `cross-env` 來設定 API 的基礎 URL。開發環境與正式環境會自動指向不同的後端服務。

*   **開發 (`pnpm run dev`)**: `http://localhost:8080/`
*   **建置 (`pnpm run build`)**: `https://ifa-rocks-899902006292.asia-east1.run.app/`

### 本地開發

1.  **安裝依賴**:
    ```bash
    pnpm install
    ```

2.  **啟動開發伺服器**:
    ```bash
    pnpm run dev
    ```
    開發伺服器將會運行在 `http://localhost:5173`。

## 建置與部署

1.  **建置正式版本**:
    ```bash
    pnpm run build
    ```
    建置後的靜態檔案會輸出到 `.vitepress/dist` 目錄。

2.  **部署至 Firebase Hosting**:
    ```bash
    pnpm run deploy
    ```

## 貢獻

歡迎任何形式的貢獻！如果您發現了 Bug 或有任何功能建議，請隨時提出 Issue。

## License

MIT Copyright © 2023-present EN Chu