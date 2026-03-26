import type { ClientProfile } from './client-profile'
import type { ClientCareer } from './client-career'
import type { ClientRetirement } from './client-retirement'
import type { ClientTax } from './client-tax'
import type { ClientLaborInsurance } from './client-labor-insurance'
import type { ClientLaborPension } from './client-labor-pension'
import type { ClientPortfolio } from './client-portfolio'
import type { ClientRealEstate } from './client-real-estate'
import type { ClientCreditCard } from './client-credit-card'
import type { ClientBusiness } from './client-business'

/**
 * 完整的理財規劃報告書資料模型
 */
export interface ClientPlan {
    profile: ClientProfile;
    career: ClientCareer;
    retirement: ClientRetirement;
    tax: ClientTax;
    laborInsurance: ClientLaborInsurance;
    laborPension: ClientLaborPension;
    portfolios: ClientPortfolio[];
    realEstates: ClientRealEstate[];
    creditCards: ClientCreditCard[];
    businesses: {
        list: ClientBusiness[];
        total: number;
        currentPage: number;
        pageSize: number;
        totalPages: number;
    };
}