/**
 * 勞退 (Labor Pension)
 * 新制退休金個人專戶
 */
export interface UserLaborPension {
    id?: string;

    /** 預計退休年齡 */
    expectedRetirementAge: number;

    /** 退休後預期餘命 */
    remainingLifeAtRetirement: number;

    /** 退休金投資報酬率預估 */
    retirementRoi: number;

    /** 雇主提繳累積額 */
    employerContribution: number;

    /** 雇主提繳收益 */
    employerEarnings: number;

    /** 個人提繳累積額 */
    personalContribution: number;

    /** 個人提繳收益 */
    personalEarnings: number;

    /** 目前年資 (月) */
    currentWorkSeniority: number;

    /** 預估退休時累積總額 (稅前 FV) */
    predictedLumpSum?: number;

    /** 預估稅後實領淨額 (Net FV) */
    predictedNetLumpSum?: number;
}
