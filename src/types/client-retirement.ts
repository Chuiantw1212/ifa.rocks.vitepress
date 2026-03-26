/**
 * 退休規劃全週期 (Retirement Lifecycle)
 * 涵蓋 Go-Go, Slow-Go, No-Go 三階段
 */
export interface ClientRetirement {
    id?: string;
    userId?: string;
    updatedAt?: string;

    // --- Phase 1: 活躍期 (Go-Go) ---
    /** 家庭型態: 獨居(single) / 伴侶(couple) */
    householdType: 'single' | 'couple';

    /** 居住模式代碼 */
    housingMode: string;

    /** 居住月預算 */
    housingCost: number;

    /** 健康等級代碼 */
    healthTierCode: string;

    /** 健康月預算 (日常保健) */
    healthCost: number;

    /** 活躍生活水準代碼 */
    activeLivingCode: string;

    /** 活躍生活月預算 (娛樂、旅遊) */
    activeLivingCost: number;

    // --- Phase 2: 慢活期 (Slow-Go) ---
    /** Slow-Go 啟動年齡 (預設 75) */
    slowGoStartAge: number;

    /** 醫療防禦策略代碼 */
    defenseTierCode: string;

    /** 定期醫療月預算 (慢性病) */
    monthlyMedicalCost: number;

    /** 重大傷病策略代碼 */
    criticalIllnessCode: string;

    /** 重大傷病一次性準備金 (風險自留額) */
    criticalIllnessReserve: number;

    // --- Phase 3: 長照期 (No-Go) ---
    /** No-Go 啟動年齡 (預設 80) */
    nogoStartAge: number;

    /** 長照模式代碼 (e.g. 居家、機構) */
    ltcCareMode: string;

    /** 每月主照護成本 */
    ltcMonthlyCost: number;

    /** 每月隱形雜支 (尿布、營養品) */
    ltcMonthlySupplies: number;

    /** 政府補助扣減額 */
    ltcSubsidy: number;
}