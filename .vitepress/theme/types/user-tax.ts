
/**
 * 稅務規劃專用設定 (Tax)
 */
export interface UserTax {
    id?: string;

    /** 預估其他所得 (股利、利息、租金等需併入綜所稅項目) */
    estimatedOtherIncome: number;
}