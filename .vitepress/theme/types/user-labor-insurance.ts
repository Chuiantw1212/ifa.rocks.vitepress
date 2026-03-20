/**
 * 勞保 (Labor Insurance)
 * 老年年金給付
 */
export interface UserLaborInsurance {
    id?: string;

    /** 預計請領年齡 */
    expectedClaimAge: number;

    /** 最高 60 個月平均投保薪資 */
    averageMonthlySalary: number;

    /** 保險年資 (月) */
    insuranceSeniority: number;

    /** 預估領取年限 */
    predictedRemainingLife: number;

    /** 預估每月領取金額 (Annuity) */
    predictedMonthlyAnnuity?: number;
}