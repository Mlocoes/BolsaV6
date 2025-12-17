import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getFiscalReport, FiscalReport as FiscalReportType, FiscalYearSummary } from '../services/fiscalService';

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

    return (
        <Layout>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Informe Fiscal (FIFO)</h1>

                <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cartera</label>
                        <select
                            value={selectedPortfolioId}
                            onChange={(e) => setSelectedPortfolioId(e.target.value)}
                            className="mt-1 block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        >
                            {portfolios.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Año Fiscal</label>
                        <input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>

                    <button
                        onClick={generateReport}
                        disabled={loading || !selectedPortfolioId}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Calculando...' : 'Generar Informe'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {report && report.years.map((yearSummary: FiscalYearSummary) => (
                    <div key={yearSummary.year} className="mb-8">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">Ejercicio {yearSummary.year}</h2>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-100">
                                <h3 className="text-sm font-medium text-green-800">Ganancias Patrimoniales</h3>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(yearSummary.total_gains)}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-100">
                                <h3 className="text-sm font-medium text-red-800">Pérdidas Patrimoniales</h3>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(yearSummary.total_losses)}</p>
                            </div>
                            <div className={`p-4 rounded-lg shadow-sm border ${yearSummary.net_result >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                                <h3 className={`text-sm font-medium ${yearSummary.net_result >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Resultado Neto</h3>
                                <p className={`text-2xl font-bold ${yearSummary.net_result >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                    {formatCurrency(yearSummary.net_result)}
                                </p>
                            </div>
                        </div>

                        {/* Detailed Table */}
                        <div className="bg-white shadow overflow-hidden rounded-lg">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Venta</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Venta</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Adq.</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Adq.</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Coste Adq.</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {yearSummary.items.map((item, idx) => (
                                            <tr key={idx} className={item.is_wash_sale ? 'bg-yellow-50' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                    {item.asset_symbol}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {formatDate(item.sale_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {formatQuantity(item.quantity_sold)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {formatCurrency(item.sale_price)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {formatCurrency(item.sale_value)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {formatDate(item.acquisition_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {formatCurrency(item.acquisition_price)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                    {formatCurrency(item.acquisition_value)}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${item.gross_result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(item.gross_result)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                    {item.is_wash_sale && (
                                                        <span className="text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded">
                                                            Wash Sale ({formatCurrency(item.wash_sale_disallowed_loss)})
                                                        </span>
                                                    )}
                                                    {item.notes && <div className="mt-1">{item.notes}</div>}
                                                </td>
                                            </tr>
                                        ))}
                                        {yearSummary.items.length === 0 && (
                                            <tr>
                                                <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                                                    No hay operaciones cerradas en este ejercicio.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Layout>
    );
};

export default FiscalReport;
