// 模擬 Firebase User 的核心欄位
export interface FirebaseUser {
    id: string; // [修改] 統一為 string，方便與資料庫 UUID 對接
    uid: string;
    displayName: string;
    email: string;
    photoUrl: string;
    isAnonymous?: boolean;
}