/**
 * 信用卡 (Credit Card)
 * 用於支出管理與現金流追蹤
 */
export interface UserCreditCard {
    id?: string;

    /** Firebase UID */
    firebaseUid?: string;

    /** 卡片名稱 (e.g. 玉山 U Bear) */
    name: string;

    /** 扣款帳戶 (e.g. 台新 Richart) */
    deductionAccount: string;

    /** 用途分類 (e.g. online, daily) */
    usageType: string;

    /** 存放位置: 錢包(wallet) / 數位(digital) / 抽屜(drawer) */
    storageLocation: 'wallet' | 'digital' | 'drawer' | string;

    /** 平均月刷卡金額 */
    averageMonthlyExpense: number;

    createdAt?: string | Date;
    updatedAt?: string | Date;
}