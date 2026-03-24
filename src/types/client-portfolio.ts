
/**
 * 金融資產 (Portfolios)
 * 包含股票、ETF、基金、外幣等
 */
export interface ClientPortfolio {
    id?: string;

    /** 投資市場代碼 (e.g., 'US', 'TW', 'JP') */
    countryCode: string;

    /** 交易幣別 (e.g., 'USD', 'TWD') */
    currency: string;

    /** 匯率 (Exchange Rate)，用於計算 TWD 市值 */
    exchangeRate: number;

    /** 庫存市值 (原幣) */
    marketValue: number;

    /** 年度已實現損益 (原幣) */
    realizedPnl: number;

    /** (選填) 標的代碼 */
    targetSymbol?: string;

    /** (選填) 資產配置權重 */
    equityWeight?: number;

    /** (選填) 年化報酬率 */
    annualizedReturn?: number;
}