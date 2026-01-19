import api from './api';

export interface FiscalResultItem {
    asset_symbol: string;
    asset_currency?: string;
    quantity_sold: number;
    sale_date: string;
    sale_price: number;
    sale_fees: number;
    sale_value: number;
    sale_price_original?: number;
    sale_fees_original?: number;
    sale_value_original?: number;
    acquisition_date: string;
    acquisition_price: number;
    acquisition_fees: number;
    acquisition_value: number;
    acquisition_price_original?: number;
    acquisition_fees_original?: number;
    acquisition_value_original?: number;
    gross_result: number;
    gross_result_original?: number;
    exchange_rate_used?: number;
    days_held: number;
    is_wash_sale: boolean;
    wash_sale_disallowed_loss: number;
    notes?: string;
}

export interface FiscalYearSummary {
    year: number;
    total_gains: number;
    total_losses: number;
    net_result: number;
    items: FiscalResultItem[];
    pending_wash_sales: FiscalResultItem[];
}

export interface FiscalReport {
    portfolio_id: string;
    generated_at: string;
    years: FiscalYearSummary[];
}

export const getFiscalReport = async (portfolioId: string, year?: number) => {
    const params = year ? { year } : {};
    const response = await api.get<FiscalReport>(`/fiscal/calculate`, {
        params: { portfolio_id: portfolioId, ...params }
    });
    return response.data;
};
