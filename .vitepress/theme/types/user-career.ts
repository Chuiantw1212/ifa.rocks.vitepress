/**
 * 職業與收入資料 (Career & Income)
 */
export interface UserCareer {
    id?: string;

    /** 本薪 (Base Salary) */
    baseSalary: number;

    /** 其他津貼 (Allowance) */
    otherAllowance: number;

    /** 勞保費個人負擔 */
    laborInsurance: number;

    /** 健保費個人負擔 */
    healthInsurance: number;

    /** 其他扣項 (福利金等) */
    otherDeduction: number;

    // --- 勞退相關 (Labor Pension) ---

    /** 個人自提率 (0 ~ 0.06) */
    pensionPersonalRate: number;

    /** 個人自提金額 (從薪資扣除) */
    pensionPersonalAmount: number;

    /** 雇主提繳金額 (額外資產，不影響實領薪資) */
    pensionEmployerAmount: number;

    /** 每月勞退總提撥 (個人+雇主)，用於計算未來現金流 */
    pensionTotalAmount: number;

    // --- 其他 ---

    /** 員工認股扣款 */
    stockDeduction: number;

    /** 公司相對提撥 (Matching) */
    stockCompanyMatch: number;

    /** 扶養親屬人數 (影響稅務) */
    dependents: number;

    /** 每月實領淨額 (Net Income) */
    monthlyNetIncome: number;

    /** 年終與非經常性獎金 */
    annualBonus: number;

    /** 全年總收入 (用於稅務階層判斷) */
    annualTotalIncome: number;
}
