import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getFiscalReport, FiscalReport as FiscalReportType } from '../services/fiscalService';

import Layout from '../components/Layout';

interface Portfolio {
    id: string;
    name: string;
}

export const getPortfolios = async (): Promise<Portfolio[]> => {
    const response = await api.get<Portfolio[]>('/portfolios');
    return response.data;
};

const FiscalReport: React.FC = () => {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [report, setReport] = useState<FiscalReportType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        loadPortfolios();
    }, []);

    const loadPortfolios = async () => {
        try {
            const data = await getPortfolios();
            setPortfolios(data);
            if (data.length > 0) {
                setSelectedPortfolioId(data[0].id);
            }
        } catch (err) {
            console.error(err);
            setError('Error loading portfolios');
        }
    };

    const generateReport = async () => {
        if (!selectedPortfolioId) return;

        setLoading(true);
        setError('');
        try {
            const data = await getFiscalReport(selectedPortfolioId, selectedYear);
            setReport(data);
        } catch (err) {
            console.error(err);
            setError('Error generating fiscal report');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number | undefined) => {
        if (val === undefined || val === null) return '';
        // User requested copy-paste friendly format for Excel: 
        // No currency symbol, simple decimal formatting.
        // Using 'es-ES' to ensure comma is used as decimal separator (matches bank report '1.999,99')
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    const formatQuantity = (val: number | undefined) => {
        if (val === undefined || val === null) return '';
        // Same es-ES formatting but with variable decimals for quantities
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 6
        }).format(val);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES');
    };

    // Obtener el resumen del año seleccionado para mostrarlo de forma fija
    const currentYearSummary = report?.years.find(y => y.year === selectedYear) || (report?.years.length ? report.years[0] : null);

    return (
        <Layout>
            <div className="h-full overflow-hidden p-3 bg-dark-bg">
                <div className="space-y-3 max-w-full mx-auto flex flex-col h-full">
                    {/* Header Row: Title & Actions inline - ALWAYS FIXED */}
                    <div className="flex flex-row flex-wrap justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border gap-3 flex-none">
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            ⚖️ Informe Fiscal (FIFO)
                        </h1>
                        <div className="flex items-center gap-2">
                            <div className="w-48">
                                <select
                                    value={selectedPortfolioId}
                                    onChange={(e) => setSelectedPortfolioId(e.target.value)}
                                    className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="">Seleccionar cartera</option>
                                    {portfolios.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <input
                                    type="number"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                            <button
                                onClick={generateReport}
                                disabled={loading || !selectedPortfolioId}
                                className={`px-4 py-1 rounded text-xs transition-colors font-medium border ${loading || !selectedPortfolioId
                                    ? 'bg-dark-bg border-dark-border text-dark-muted cursor-not-allowed'
                                    : 'bg-primary border-primary hover:bg-primary-dark text-white'
                                    }`}
                            >
                                {loading ? 'Calculando...' : 'Generar Informe'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-3 py-2 rounded-lg text-xs flex-none">
                            {error}
                        </div>
                    )}

                    {currentYearSummary ? (
                        <>
                            {/* Summary Cards Row - FIXED */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-none">
                                <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                                    <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Ganancias ({currentYearSummary.year})</h3>
                                    <div className="text-lg font-bold text-green-500 leading-tight">
                                        {formatCurrency(currentYearSummary.total_gains)}
                                    </div>
                                </div>
                                <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                                    <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Pérdidas ({currentYearSummary.year})</h3>
                                    <div className="text-lg font-bold text-red-500 leading-tight">
                                        {formatCurrency(currentYearSummary.total_losses)}
                                    </div>
                                </div>
                                <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                                    <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Resultado Neto</h3>
                                    <div className={`text-lg font-bold leading-tight ${currentYearSummary.net_result >= 0 ? 'text-green-500' : 'text-orange-500'}`}>
                                        {formatCurrency(currentYearSummary.net_result)}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Table Container - FLEX-1 with INTERNAL SCROLL */}
                            <div className="bg-dark-surface border border-dark-border rounded-lg flex-1 min-h-0 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <table className="min-w-full divide-y divide-dark-border text-[11px] border-collapse">
                                        <thead className="sticky top-0 z-10 bg-dark-bg shadow-sm">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-semibold text-dark-muted uppercase border-b border-dark-border">Activo</th>
                                                <th className="px-3 py-2 text-right font-semibold text-dark-muted uppercase border-b border-dark-border">F. Venta</th>
                                                <th className="px-3 py-2 text-right font-semibold text-dark-muted uppercase border-b border-dark-border">Ctd</th>
                                                <th className="px-3 py-2 text-right font-semibold text-dark-muted uppercase border-b border-dark-border">P. Venta</th>
                                                <th className="px-3 py-2 text-right font-semibold text-dark-muted uppercase border-b border-dark-border">F. Adq.</th>
                                                <th className="px-3 py-2 text-right font-semibold text-dark-muted uppercase border-b border-dark-border">P. Adq.</th>
                                                <th className="px-3 py-2 text-right font-semibold text-dark-muted uppercase border-b border-dark-border">Resultado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-border">
                                            {currentYearSummary.items.map((item, idx) => (
                                                <tr key={idx} className={`hover:bg-white/5 transition-colors ${item.is_wash_sale ? 'bg-yellow-900/10' : ''}`}>
                                                    <td className="px-3 py-1.5 font-medium text-white">{item.asset_symbol}</td>
                                                    <td className="px-3 py-1.5 text-right text-dark-text">{formatDate(item.sale_date)}</td>
                                                    <td className="px-3 py-1.5 text-right text-dark-text">{formatQuantity(item.quantity_sold)}</td>
                                                    <td className="px-3 py-1.5 text-right text-dark-text">{formatCurrency(item.sale_price)}</td>
                                                    <td className="px-3 py-1.5 text-right text-dark-text">{formatDate(item.acquisition_date)}</td>
                                                    <td className="px-3 py-1.5 text-right text-dark-text">{formatCurrency(item.acquisition_price)}</td>
                                                    <td className={`px-3 py-1.5 text-right font-bold ${item.gross_result >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {formatCurrency(item.gross_result)}
                                                        {item.is_wash_sale && (
                                                            <span className="block text-[9px] text-yellow-500 font-normal">
                                                                Wash Sale disallowed
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-dark-surface border border-dark-border rounded-lg min-h-0">
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                                    <p className="text-xs text-dark-muted tracking-wide">Calculando resultados fiscales método FIFO...</p>
                                </>
                            ) : (
                                <>
                                    <div className="text-3xl mb-4 opacity-30">⚖️</div>
                                    <p className="text-xs text-dark-muted">Selecciona una cartera y genera el informe fiscal.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default FiscalReport;
