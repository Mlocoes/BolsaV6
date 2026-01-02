import api from './api';

export interface PerformancePoint {
    date: string;
    value: number;
    invested: number;
}

export interface MonthlyValue {
    month: string;
    value: number;
}

export interface AssetAllocation {
    symbol: string;
    name: string;
    value: number;
    percentage: number;
    type: string;
}

export interface DashboardStats {
    performance_history: PerformancePoint[];
    monthly_values: MonthlyValue[];
    asset_allocation: AssetAllocation[];
    total_value: number;
    total_invested: number;
    total_pl: number;
    total_pl_percentage: number;
}

export const getDashboardStats = async (portfolioId: string, year?: number, online: boolean = false): Promise<DashboardStats> => {
    const response = await api.get(`/dashboard/${portfolioId}/stats`, {
        params: { year, online }
    });
    return response.data;
};
