import type { UserProfile } from './user-profile'
import type { UserCareer } from './user-career'
import type { UserRetirement } from './user-retirement'
import type { UserTax } from './user-tax'
import type { UserLaborInsurance } from './user-labor-insurance'
import type { UserLaborPension } from './user-labor-pension'
import type { UserPortfolio } from './user-portfolio'
import type { UserRealEstate } from './user-real-estate'
import type { UserCreditCard } from './user-credit-card'
import type { UserBusiness } from './user-business'

/**
 * 完整的理財規劃報告書資料模型
 */
export interface UserPlan {
    profile: UserProfile;
    career: UserCareer;
    retirement: UserRetirement;
    tax: UserTax;
    laborInsurance: UserLaborInsurance;
    laborPension: UserLaborPension;
    portfolios: UserPortfolio[];
    realEstates: UserRealEstate[];
    creditCards: UserCreditCard[];
    businesses: {
        list: UserBusiness[];
        total: number;
        currentPage: number;
        pageSize: number;
        totalPages: number;
    };
}