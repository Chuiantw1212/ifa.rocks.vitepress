import { computed, type Ref } from 'vue';

/**
 * 勞保老年年金計算結果
 */
export interface AnnuityResult {
    formulaA: number;
    formulaB: number;
    baseAmount: number; // 擇優金額
    percentageModifier: number; // 展延/減給百分比
    bestAmount: number; // 最終金額
    diffYears: number; // 與法定年齡差距
    msg: string; // 狀態訊息
}

/**
 * 勞保老年年金計算機 Composable
 * @param averageMonthlySalary - 平均月投保薪資 (ref)
 * @param totalSeniorityInYears - 總年資(年) (ref)
 * @param expectedClaimAge - 預計請領年齡 (ref)
 * @param statutoryAge - 法定請領年齡 (ref)
 */
export function useLaborInsuranceAnnuity(
    averageMonthlySalary: Ref<number>,
    totalSeniorityInYears: Ref<number>,
    expectedClaimAge: Ref<number>,
    statutoryAge: Ref<number>
) {
    const result = computed<AnnuityResult>(() => {
        const salary = averageMonthlySalary.value || 0;
        const seniority = totalSeniorityInYears.value || 0;

        if (salary <= 0 || seniority <= 0) {
            return { formulaA: 0, formulaB: 0, baseAmount: 0, percentageModifier: 1, bestAmount: 0, diffYears: 0, msg: '請輸入有效的薪資與年資' };
        }

        // A式：(平均月投保薪資 × 投保年資 × 0.775%) + 3,000元
        const formulaA = Math.round((salary * seniority * 0.00775) + 3000);
        // B式：平均月投保薪資 × 投保年資 × 1.55%
        const formulaB = Math.round(salary * seniority * 0.0155);

        const baseAmount = Math.max(formulaA, formulaB);

        // 計算展延或減給
        const diffYears = expectedClaimAge.value - statutoryAge.value;
        let percentageModifier = 1;
        let msg = '';

        if (diffYears < 0) { // 提前領 (減給)
            percentageModifier = 1 + (diffYears * 0.04); // diffYears is negative
            msg = `提前 ${Math.abs(diffYears)} 年請領，每月減給 ${(Math.abs(diffYears) * 4).toFixed(0)}%`;
        } else if (diffYears > 0) { // 延後領 (展延)
            percentageModifier = 1 + (diffYears * 0.04);
            msg = `展延 ${diffYears} 年請領，每月增給 ${(diffYears * 4).toFixed(0)}%`;
        } else {
            msg = '於法定年齡請領，金額不加不減';
        }
        
        percentageModifier = Math.max(0.8, Math.min(1.2, percentageModifier));

        const bestAmount = Math.round(baseAmount * percentageModifier);

        return { formulaA, formulaB, baseAmount, percentageModifier, bestAmount, diffYears, msg };
    });

    return { result };
}