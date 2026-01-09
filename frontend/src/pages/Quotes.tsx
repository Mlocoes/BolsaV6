/**
 * Página de Cotizaciones con filtros
 */
import { useEffect, useState, useRef, useMemo } from 'react';
import { useHandsontable } from '../hooks/useHandsontable';

import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';

interface Quote {
    id: string;
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export default function Quotes() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [selectedAsset, setSelectedAsset] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const requestCount = useRef(0);

    useEffect(() => {
        loadAssets();
    }, []);

    useEffect(() => {
        if (!selectedAsset) return;

        // Debounce para evitar múltiples llamadas mientras el usuario escribe fechas
        const timer = setTimeout(() => {
            loadQuotes();
        }, 300);

        return () => clearTimeout(timer);
    }, [selectedAsset, startDate, endDate]);

    // Memoize columns and headers based on selectedAsset
    const { columns, headers } = useMemo(() => {
        const cols: any[] = [];
        const hds: string[] = [];

        if (selectedAsset === 'all') {
            cols.push({ data: 'symbol', readOnly: true, width: 100, className: 'htLeft' });
            cols.push({ data: 'name', readOnly: true, width: 200, className: 'htLeft' });
            hds.push('Símbolo', 'Nombre');
        }

        cols.push(
            {
                data: 'date',
                readOnly: true,
                width: 100,
                className: 'htRight',
                renderer: function (_instance: any, td: HTMLTableCellElement, _row: number, _col: number, _prop: any, value: any) {
                    td.textContent = value ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';
                    td.style.textAlign = 'right';
                    return td;
                }
            },
            {
                data: 'open',
                readOnly: true,
                width: 100,
                className: 'htRight',
                renderer: function (_instance: any, td: HTMLTableCellElement, _row: number, _col: number, _prop: any, value: any) {
                    if (typeof value === 'number') {
                        td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    } else {
                        td.textContent = value || '';
                    }
                    td.style.textAlign = 'right';
                    return td;
                }
            },
            {
                data: 'high',
                readOnly: true,
                width: 100,
                className: 'htRight',
                renderer: function (_instance: any, td: HTMLTableCellElement, _row: number, _col: number, _prop: any, value: any) {
                    if (typeof value === 'number') {
                        td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    } else {
                        td.textContent = value || '';
                    }
                    td.style.textAlign = 'right';
                    return td;
                }
            },
            {
                data: 'low',
                readOnly: true,
                width: 100,
                className: 'htRight',
                renderer: function (_instance: any, td: HTMLTableCellElement, _row: number, _col: number, _prop: any, value: any) {
                    if (typeof value === 'number') {
                        td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    } else {
                        td.textContent = value || '';
                    }
                    td.style.textAlign = 'right';
                    return td;
                }
            },
            {
                data: 'close',
                readOnly: true,
                width: 110,
                className: 'htRight',
                renderer: function (_instance: any, td: HTMLTableCellElement, _row: number, _col: number, _prop: any, value: any) {
                    if (typeof value === 'number') {
                        td.textContent = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    } else {
                        td.textContent = value || '';
                    }
                    td.style.fontWeight = 'bold';
                    td.style.textAlign = 'right';
                    return td;
                }
            },
            {
                data: 'volume',
                readOnly: true,
                width: 130,
                className: 'htRight',
                type: 'numeric',
                numericFormat: {
                    pattern: '0',
                    culture: 'es-ES'
                }
            }
        );
        hds.push('Fecha', 'Aper.', 'Máx.', 'Mín.', 'Cierre', 'Vol.');

        return { columns: cols, headers: hds };
    }, [selectedAsset]);

    // Use the custom hook for Handsontable
    const { containerRef } = useHandsontable({
        data: quotes,
        columns: columns,
        colHeaders: headers,
        settings: {
            autoColumnSize: false,
        }
    });

    /**
     * Carga el catálogo de activos
     */
    const loadAssets = async () => {
        try {
            const response = await api.get('/assets/');
            setAssets(response.data);
            if (response.data.length > 0 && !selectedAsset) {
                setSelectedAsset('all'); // Cambiado de la primera cartera a "todos" por defecto
            }
        } catch (error) {
            console.error('Error loading assets:', error);
            toast.error('Error al cargar los activos.');
        }
    };

    /**
     * Carga las cotizaciones filtradas por activo y fechas
     */
    const loadQuotes = async () => {
        const currentReq = ++requestCount.current;
        setLoading(true);
        try {
            // Validar fechas antes de hacer la petición
            if (startDate && isNaN(Date.parse(startDate))) {
                toast.error('Fecha de inicio inválida');
                return;
            }
            if (endDate && isNaN(Date.parse(endDate))) {
                toast.error('Fecha de fin inválida');
                return;
            }

            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const endpoint = selectedAsset === 'all' ? '/quotes/' : `/quotes/asset/${selectedAsset}/`;
            const response = await api.get(`${endpoint}?${params}`);

            // Evitar race conditions: si hubo una petición posterior, ignorar esta
            if (currentReq < requestCount.current) return;

            // Mapear para que el símbolo y nombre estén accesibles fácilmente para ag-grid
            const mappedData = response.data.map((q: any) => ({
                ...q,
                symbol: q.asset ? q.asset.symbol : '',
                name: q.asset ? q.asset.name : ''
            }));

            setQuotes(mappedData);
        } catch (error: any) {
            // Solo mostrar error si es la última petición
            if (currentReq === requestCount.current) {
                console.error('Error loading quotes:', error);
                if (error.response?.status === 422) {
                    toast.error('Fechas inválidas. Verifica el formato.');
                } else {
                    toast.error('Error al cargar las cotizaciones.');
                }
            }
        } finally {
            if (currentReq === requestCount.current) {
                setLoading(false);
            }
        }
    };

    /**
     * Inicia la sincronización masiva de cotizaciones de todos los activos
     */
    const handleSyncAll = async () => {
        setSyncing(true);
        try {
            await api.post('/quotes/sync-all');
            toast.success('Sincronización masiva iniciada en segundo plano.');
        } catch (error) {
            console.error('Error syncing quotes:', error);
            toast.error('Error al iniciar la sincronización.');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <Layout>
            <div className="h-full overflow-hidden p-3 bg-dark-bg flex flex-col gap-3">
                {/* Header Card */}
                <div className="flex flex-row justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            📈 Cotizaciones
                        </h1>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedAsset}
                                onChange={(e) => setSelectedAsset(e.target.value)}
                                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary min-w-[200px]"
                            >
                                <option value="all">Todos los activos</option>
                                {assets.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.symbol} - {asset.name}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                                placeholder="Inicio"
                            />

                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                                placeholder="Fin"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSyncAll}
                        disabled={syncing}
                        className={`bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-2 ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {syncing ? 'Sincronizando...' : '🔄 Sincronizar Todo'}
                    </button>
                </div>

                {/* Table Card */}
                <div className="flex-1 min-h-0 bg-dark-surface rounded-lg border border-dark-border overflow-hidden flex flex-col relative">
                    {loading && (
                        <div className="absolute inset-0 bg-dark-bg/50 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="text-primary text-sm font-medium animate-pulse">Cargando cotizaciones...</div>
                        </div>
                    )}

                    <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden handsontable-dark"></div>
                </div>
            </div>
        </Layout>
    );
}
