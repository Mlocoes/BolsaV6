/**
 * Formateadores para compatibilidad con Excel (copiar-pegar)
 * Usan locale 'es-ES' (coma decimal) y evitan símbolos de moneda/porcentaje
 */

export const formatCurrency = (val: number | undefined | null, _currency?: string): string => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    }).format(val);
};

/**
 * Obtiene el símbolo de una moneda
 */
export const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
        EUR: '€',
        USD: '$',
        GBP: '£',
        JPY: '¥',
        CHF: 'CHF',
        CAD: 'C$',
    };
    return symbols[currency] || currency;
};

export const formatQuantity = (val: number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: false
    }).format(val);
};

export const formatPercent = (val: number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    }).format(val);
};
