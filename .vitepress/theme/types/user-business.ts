
/**
 * 商業/副業 (Business / Side Hustle)
 * 例如：太陽能板投資、加盟店、網拍
 */
export interface UserBusiness {
    id?: string;

    /** 專案名稱 */
    name: string;

    /** 稅務類別: 6%推計(deemed_6) / 核實申報(verified) / 免稅(exempt) */
    taxCategory: 'deemed_6' | 'verified' | 'exempt';

    /** 取得成本 (本金) */
    acquisitionCost: number;

    /** 開始日期 */
    startDate: string;

    /** 專案年限 */
    projectYears: number;

    /** 收入模式: 每月固定(monthly) / 累計總額反推(total) */
    incomeMode: 'monthly' | 'total';

    /** 歷史累計總營收 (當 mode='total' 時必填) */
    totalAccumulatedIncome?: number;

    /** 預估月平均收入 */
    monthlyIncome: number;

    /** 每月營運成本 */
    monthlyCost: number;

    /** 貸款金額 */
    loanAmount: number;

    /** 貸款利率 */
    loanInterestRate: number;

    /** 投報率 ROI (顯示用字串或數值) */
    roi?: string | number;

    /** 內部報酬率 IRR */
    irr?: string | number;

    /** 群組 ID (若有) */
    groupId?: number;
}