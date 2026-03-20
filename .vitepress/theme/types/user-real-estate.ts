
/**
 * 不動產資產 (Real Estate)
 */
export interface UserRealEstate {
    id?: string;

    /** 物件名稱 (e.g. 板橋自用宅) */
    name: string;

    /** 屋齡 */
    age: number;

    /** 權狀坪數 */
    size: number;

    /** 單價 (萬/坪) */
    pricePerPing: number;

    /** 總價 (市價) = 單價 * 坪數 */
    totalPrice: number;

    /** 公告/評定現值 (稅基) */
    assessedValue: number;

    /** 預估持有稅率 (%) */
    holdingTaxRate: number;

    /** 實際支付持有稅 (年) */
    actualHoldingCost: number;

    /** 銀行貸款餘額 */
    loanAmount: number;

    /** 貸款年利率 (%) */
    interestRate: number;

    /** 用途: 自用(self) / 出租(rent) / 閒置(vacant) */
    usageType: 'self' | 'rent' | 'vacant';

    /** 月租金收入 (僅當 rent 時有效) */
    monthlyRent: number;
}