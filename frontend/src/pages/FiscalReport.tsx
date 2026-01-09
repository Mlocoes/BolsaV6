import React, { useState, useEffect, useRef } from 'react';
import Handsontable from 'handsontable';

import api from '../services/api';
import { getFiscalReport, FiscalReport as FiscalReportType } from '../services/fiscalService';
import { formatCurrency } from '../utils/formatters';
import { currencyRenderer, dateRenderer, priceRenderer, numberRenderer } from '../utils/handsontableUtils';
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
    const hotTableRef = useRef<HTMLDivElement>(null);
    const hotInstance = useRef<Handsontable | null>(null);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [report, setReport] = useState<FiscalReportType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        loadPortfolios();
    }, []);

    // Inicializar Handsontable
    useEffect(() => {
        if (!hotTableRef.current || !report) return;

        // Extraer todas las transacciones de todos los años
        const allTransactions = report.years.flatMap(year => year.items);

        if (!allTransactions.length) return;

        if (hotInstance.current) {
            hotInstance.current.destroy();
        }

        hotInstance.current = new Handsontable(hotTableRef.current, {
            data: allTransactions,
            licenseKey: 'non-commercial-and-evaluation',
            width: '100%',
            height: '100%',
            colHeaders: ['Activo', 'F. Venta', 'Ctd', 'P. Venta', 'F. Adq.', 'P. Adq.', 'Resultado', 'Wash Sale'],
            columns: [
                {
                    data: 'asset_symbol',
                    readOnly: true,
                    width: 100,
                    className: 'htLeft',
                    renderer: function (_instance: any, td: HTMLTableCellElement, _row: number, _col: number, _prop: any, value: any) {
                        td.textContent = value || '';
                        td.style.fontWeight = 'bold';
                        return td;
                    }
                },
                {
                    data: 'sale_date',
                    readOnly: true,
                    width: 100,
                    className: 'htRight',
                    renderer: dateRenderer
                },
                {
                    data: 'quantity_sold',
                    readOnly: true,
                    width: 90,
                    className: 'htRight',
                    renderer: numberRenderer
                },
                {
                    data: 'sale_price',
                    readOnly: true,
                    width: 100,
                    className: 'htRight',
                    renderer: priceRenderer
                },
                {
                    data: 'acquisition_date',
                    readOnly: true,
                    width: 100,
                    className: 'htRight',
                    renderer: dateRenderer
                },
                {
                    data: 'acquisition_price',
                    readOnly: true,
                    width: 100,
                    className: 'htRight',
                    renderer: priceRenderer
                },
                {
                    data: 'gross_result',
                    readOnly: true,
                    width: 120,
                    className: 'htRight',
                    renderer: function (instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any, cellProperties: any) {
                        currencyRenderer(instance, td, row, col, prop, value, cellProperties);
                        if (typeof value === 'number') {
                            td.style.color = value >= 0 ? '#10b981' : '#ef4444';
                            td.style.fontWeight = 'bold';
                        }
                        return td;
                    }
                },
                {
                    data: 'is_wash_sale',
                    readOnly: true,
                    width: 100,
                    className: 'htCenter',
                    renderer: function (_instance: any, td: HTMLTableCellElement, _row: number, _col: number, _prop: any, value: any) {
                        td.textContent = value ? 'SÍ' : 'No';
                        if (value) td.style.color = '#f59e0b';
                        td.style.textAlign = 'center';
                        return td;
                    }
                }
            ],
            rowHeaders: true,
            stretchH: 'all',
            autoColumnSize: false,
            filters: true,
            dropdownMenu: [
                'filter_by_condition',
                'filter_by_value',
                'filter_action_bar'
            ],
            columnSorting: true,
            manualColumnResize: true,
            wordWrap: false,
            themeName: 'ht-theme-main'
        });

        return () => {
            if (hotInstance.current) {
                hotInstance.current.destroy();
                hotInstance.current = null;
            }
        };
    }, [report]);

    /**
     * Carga la lista de carteras disponibles
     */
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

    /**
     * Genera el informe fiscal para la cartera y el año seleccionados
     */
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
                            <div ref={hotTableRef} className="rounded-lg border border-dark-border flex-1 min-h-[300px] overflow-hidden handsontable-dark"></div>
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
