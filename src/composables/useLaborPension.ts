import { ref, computed } from 'vue';

// 定義級距資料結構
interface PensionBracket {
    limit: number; // 該級距的上限
    value: number; // 月提繳工資
}

/**
 * [cite_start]勞工退休金月提繳分級表 (民國 115 年 1 月 1 日生效) [cite: 1, 2]
 * [cite_start]資料來源：勞動部勞動福3字第1140153598號令 [cite: 2]
 */
const PENSION_BRACKETS: PensionBracket[] = [
    // --- 第1組 ---
    { limit: 1500, value: 1500 }, // [cite: 3]
    { limit: 3000, value: 3000 },
    { limit: 4500, value: 4500 },
    { limit: 6000, value: 6000 },
    { limit: 7500, value: 7500 },
    // --- 第2組 ---
    { limit: 8700, value: 8700 },
    { limit: 9900, value: 9900 },
    { limit: 11100, value: 11100 },
    { limit: 12540, value: 12540 },
    { limit: 13500, value: 13500 },
    // --- 第3組 ---
    { limit: 15840, value: 15840 },
    { limit: 16500, value: 16500 },
    { limit: 17280, value: 17280 },
    { limit: 17880, value: 17880 },
    { limit: 19047, value: 19047 },
    { limit: 20008, value: 20008 },
    { limit: 21009, value: 21009 },
    { limit: 22000, value: 22000 },
    { limit: 23100, value: 23100 },
    // --- 第4組 ---
    { limit: 24000, value: 24000 },
    { limit: 25250, value: 25250 },
    { limit: 26400, value: 26400 },
    { limit: 27600, value: 27600 },
    { limit: 28590, value: 28590 },
    { limit: 29500, value: 29500 },
    // --- 第5組 ---
    { limit: 30300, value: 30300 },
    { limit: 31800, value: 31800 },
    { limit: 33300, value: 33300 },
    { limit: 34800, value: 34800 },
    { limit: 36300, value: 36300 },
    // --- 第6組 ---
    { limit: 38200, value: 38200 },
    { limit: 40100, value: 40100 },
    { limit: 42000, value: 42000 },
    { limit: 43900, value: 43900 },
    { limit: 45800, value: 45800 },
    // --- 第7組 ---
    { limit: 48200, value: 48200 },
    { limit: 50600, value: 50600 },
    { limit: 53000, value: 53000 },
    { limit: 55400, value: 55400 },
    { limit: 57800, value: 57800 },
    // --- 第8組 ---
    { limit: 60800, value: 60800 },
    { limit: 63800, value: 63800 },
    { limit: 66800, value: 66800 },
    { limit: 69800, value: 69800 },
    { limit: 72800, value: 72800 },
    // --- 第9組 ---
    { limit: 76500, value: 76500 },
    { limit: 80200, value: 80200 },
    { limit: 83900, value: 83900 },
    { limit: 87600, value: 87600 },
    { limit: 92100, value: 92100 },
    { limit: 96600, value: 96600 },
    { limit: 101100, value: 101100 },
    { limit: 105600, value: 105600 },
    { limit: 110100, value: 110100 },
    // --- 第10組 ---
    { limit: 115500, value: 115500 },
    { limit: 120900, value: 120900 },
    { limit: 126300, value: 126300 },
    { limit: 131700, value: 131700 },
    { limit: 137100, value: 137100 },
    { limit: 142500, value: 142500 },
    // --- 第11組 ---
    { limit: 147900, value: 147900 },
    { limit: Infinity, value: 150000 },
];

/**
 * 勞退計算 Composable
 * @param initialWage 初始工資
 * @param initialSelfRate 初始自提率 (0~6)
 */
export function useLaborPension(initialWage: number = 0, initialSelfRate: number = 0) {
    // 響應式輸入
    const actualWage = ref(initialWage);
    const selfRate = ref(initialSelfRate); // 個人自提率 (0-6%)

    // 內部計算：取得月提繳工資 (Insured Wage)
    const insuredWage = computed(() => {
        const wage = Number(actualWage.value);
        if (wage <= 0) return 0;

        // 查找級距：薪資 <= 上限 的第一個級距
        // 若薪資超過表定最高級距 (例如 > 150,000)，則取最高級距 150,000
        const bracket = PENSION_BRACKETS.find(b => wage <= b.limit);
        return bracket ? bracket.value : 150000;
    });

    // 1. 計算自提金額 (Self Contribution) -> 這是減項
    const selfAmount = computed(() => {
        const rate = Number(selfRate.value);
        return Math.round(insuredWage.value * (rate / 100));
    });

    // 2. 計算公提金額 (Employer Contribution) -> 這是資產累積，強制 6%
    const employerAmount = computed(() => {
        // 雇主強制提撥 6%
        return Math.round(insuredWage.value * 0.06);
    });

    return {
        actualWage,      // 輸入：實際工資
        selfRate,        // 輸入：自提率 (v-model 綁定這裡)
        insuredWage,     // 輸出：提繳工資級距 (可顯示給使用者看)
        selfAmount,      // 輸出：自提金額 (從薪水扣)
        employerAmount   // 輸出：公提金額 (公司出)
    };
}

/**
 * 勞退一次領的稅務計算結果
 */
export interface LumpSumTaxResult {
    /** 應稅所得額 */
    taxableIncome: number;
    /** 預估稅額 (以獨立稅率計算) */
    taxAmount: number;
    /** 稅後淨領金額 */
    netReceive: number;
    /** 免稅額度 */
    taxFreeAmount: number;
    /** 需半數計稅之金額 */
    halfTaxableAmount: number;
    /** 需全額計稅之金額 */
    fullTaxableAmount: number;
}

/**
 * 勞退一次領稅務計算機 Composable
 * 提供計算勞工退休金一次請領時的應稅所得額與預估稅額。
 */
export function useLumpSumTaxCalculator() {
    // 財政部公告之 112 年度退職所得定額免稅金額 (適用於 2024 年申報)
    // 這些數值未來可能會隨通膨調整
    const THRESHOLD_1_PER_YEAR = 188000;
    const THRESHOLD_2_PER_YEAR = 377000;

    /**
     * 台灣綜合所得稅累進稅率 (112年度 / 2024年申報)
     */
    const TAX_BRACKETS = [
        { limit: 590000, rate: 0.05 },
        { limit: 1330000, rate: 0.12 },
        { limit: 2660000, rate: 0.20 },
        { limit: 4980000, rate: 0.30 },
        { limit: Infinity, rate: 0.40 },
    ];

    /**
     * 根據所得淨額計算預估稅額
     * @param income - 應稅所得額
     * @returns 預估稅金
     */
    const calculateProgressiveTax = (income: number): number => {
        if (income <= 0) return 0;
        let tax = 0;
        let remainingIncome = income;
        let lastLimit = 0;

        for (const bracket of TAX_BRACKETS) {
            if (remainingIncome > 0) {
                const taxableInBracket = Math.min(remainingIncome, bracket.limit - lastLimit);
                tax += taxableInBracket * bracket.rate;
                remainingIncome -= taxableInBracket;
                lastLimit = bracket.limit;
            } else {
                break;
            }
        }
        return Math.round(tax);
    };

    /**
     * 計算勞退一次領的應稅資訊
     * @param totalLumpSum - 預計一次領取的總金額
     * @param yearsOfService - 總服務年資
     * @returns 稅務計算結果
     */
    const calculateLumpSumTax = (
        totalLumpSum: number,
        yearsOfService: number
    ): LumpSumTaxResult => {
        if (totalLumpSum <= 0 || yearsOfService <= 0) {
            return { taxableIncome: 0, taxAmount: 0, netReceive: totalLumpSum, taxFreeAmount: totalLumpSum, halfTaxableAmount: 0, fullTaxableAmount: 0 };
        }

        const threshold1 = THRESHOLD_1_PER_YEAR * yearsOfService;
        const threshold2 = THRESHOLD_2_PER_YEAR * yearsOfService;

        let taxableIncome = 0;
        const halfTaxableAmount = Math.max(0, Math.min(totalLumpSum, threshold2) - threshold1);
        const fullTaxableAmount = Math.max(0, totalLumpSum - threshold2);

        taxableIncome = (halfTaxableAmount * 0.5) + fullTaxableAmount;

        const finalTaxableIncome = Math.round(taxableIncome);
        const taxAmount = calculateProgressiveTax(finalTaxableIncome);
        const netReceive = totalLumpSum - taxAmount;

        return {
            taxableIncome: finalTaxableIncome,
            taxAmount,
            netReceive,
            taxFreeAmount: Math.min(totalLumpSum, threshold1),
            halfTaxableAmount,
            fullTaxableAmount,
        };
    };

    return { calculateLumpSumTax };
}