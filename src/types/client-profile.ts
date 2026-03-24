/**
 * 個人基本資料 (Personal Profile)
 */
export interface ClientProfile {
    /** 資料庫唯一識別碼 */
    id?: string;

    /** 出生日期 (格式: YYYY-MM-DD) */
    birthDate: string;

    /** 生理性別 (影響預期壽命與保費計算) */
    gender: 'MALE' | 'FEMALE';

    /** 當前試算年齡 */
    currentAge: number;

    /** 預期壽命 (依據國發會推估或自訂) */
    lifeExpectancy: number;

    /** 結婚年份 (建議存字串，如 '2020') */
    marriageYear: number;

    /** 職業保險類別 (例如：勞保 LABOR、公保 PUBLIC) */
    careerInsuranceType: string;

    /** 個人簡介/故事 */
    biography?: string;
}
