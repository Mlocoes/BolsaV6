/**
 * Página de Cotizaciones con filtros
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { formatCurrency, formatQuantity } from '../utils/formatters';

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
    const gridRef = useRef<AgGridReact>(null);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [selectedAsset, setSelectedAsset] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const requestCount = useRef(0);

    const columnDefs: ColDef[] = [
        {
            field: 'symbol',
            headerName: 'Símbolo',
            width: 100,
            hide: selectedAsset !== 'all',
            cellClass: 'text-primary font-medium'
        },
        {
            field: 'name',
            headerName: 'Nombre',
            width: 200,
            hide: selectedAsset !== 'all',
            cellClass: 'text-gray-400'
        },
        {
            field: 'date',
            headerName: 'Fecha',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '-'
        },
        {
            field: 'open',
            headerName: 'Aper.',
            width: 100,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'high',
            headerName: 'Máx.',
            width: 100,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'low',
            headerName: 'Mín.',
            width: 100,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'close',
            headerName: 'Cierre',
            width: 110,
            valueFormatter: (params) => formatCurrency(params.value),
            cellClass: 'font-bold text-white'
        },
        {
            field: 'volume',
            headerName: 'Vol.',
            width: 130,
            valueFormatter: (params) => formatQuantity(params.value)
        },
    ];

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

    const loadQuotes = async () => {
        const currentReq = ++requestCount.current;
        setLoading(true);
        try {
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
        } catch (error) {
            // Solo mostrar error si es la última petición
            if (currentReq === requestCount.current) {
                console.error('Error loading quotes:', error);
                toast.error('Error al cargar las cotizaciones.');
            }
        } finally {
            if (currentReq === requestCount.current) {
                setLoading(false);
            }
        }
    };

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

                    <div className="ag-theme-quartz-dark flex-1">
                        <AgGridReact
                            ref={gridRef}
                            rowData={quotes}
                            columnDefs={columnDefs}
                            defaultColDef={{
                                sortable: true,
                                resizable: true,
                                filter: true,
                                suppressMovable: true,
                            }}
                            pagination={true}
                            paginationPageSize={50}
                            animateRows={true}
                            suppressCellFocus={true}
                            rowHeight={32}
                            headerHeight={36}
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
