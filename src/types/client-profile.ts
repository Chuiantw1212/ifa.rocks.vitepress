/**
 * 個人基本資料 (Personal Profile)
 */
export interface ClientProfile {
    /** 資料庫唯一識別碼 */
    id?: string;

    /** 客戶姓名 */
    name?: string;

    /** Email */
    email?: string;

    /** 聯絡電話 */
    phone?: string | null;

    /** Line ID */
    lineId?: string | null;

    /** 出生日期 (格式: YYYY-MM-DD) */
    birthDate: string | null;

    /** 生理性別 (影響預期壽命與保費計算) */
    gender: 'MALE' | 'FEMALE' | null;

    /** 當前試算年齡 */
    currentAge: number | null;

    /** 預計退休年齡 */
    retirementAge?: number | null;

    /** 預期壽命 (依據國發會推估或自訂) */
    lifeExpectancy: number | null;

    /** 退休後餘命 */
    lifeExpectancyAtRetirement?: number | null;

    /** 結婚年份 (建議存字串，如 '2020') */
    marriageYear: number | null;

    /** 職業保險類別 (例如：勞保 LABOR、公保 PUBLIC) */
    careerInsuranceType: string | null;

    /** 個人簡介/故事 */
    biography?: string | null;
}
