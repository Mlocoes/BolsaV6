/**
 * Formateadores para compatibilidad con Excel (copiar-pegar)
 * Usan locale 'es-ES' (coma decimal) y evitan símbolos de moneda/porcentaje
 */

export const formatCurrency = (val: number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    }).format(val);
};

export const formatQuantity = (val: number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
        useGrouping: true
    }).format(val);
};

export const formatPercent = (val: number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    }).format(val);
};
