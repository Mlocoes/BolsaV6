/**
 * Página de Cotizaciones con filtros
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
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
    const gridRef = useRef<AgGridReact>(null);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [selectedAsset, setSelectedAsset] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const columnDefs: ColDef[] = [
        {
            field: 'date',
            headerName: 'Fecha',
            width: 150,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString()
        },
        {
            field: 'open',
            headerName: 'Apertura',
            width: 120,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        {
            field: 'high',
            headerName: 'Máximo',
            width: 120,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        {
            field: 'low',
            headerName: 'Mínimo',
            width: 120,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`
        },
        {
            field: 'close',
            headerName: 'Cierre',
            width: 120,
            valueFormatter: (params) => `$${params.value.toFixed(2)}`,
            cellStyle: { fontWeight: 'bold' }
        },
        {
            field: 'volume',
            headerName: 'Volumen',
            width: 150,
            valueFormatter: (params) => params.value.toLocaleString()
        },
    ];

    useEffect(() => {
        loadAssets();
    }, []);

    useEffect(() => {
        if (selectedAsset) {
            loadQuotes();
        }
    }, [selectedAsset, startDate, endDate]);

    const loadAssets = async () => {
        try {
            const response = await api.get('/assets');
            setAssets(response.data);
            if (response.data.length > 0) {
                setSelectedAsset(response.data[0].id);
            }
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    };

    const loadQuotes = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await api.get(`/quotes/asset/${selectedAsset}?${params}`);
            setQuotes(response.data);
        } catch (error) {
            console.error('Error loading quotes:', error);
        }
    };

    return (
        <Layout>
            <div className="space-y-4 h-[calc(100vh-12rem)]">
                <div>
                    <h1 className="text-3xl font-bold mb-4">Cotizaciones</h1>

                    {/* Filtros */}
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Activo</label>
                                <select
                                    value={selectedAsset}
                                    onChange={(e) => setSelectedAsset(e.target.value)}
                                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    {assets.map((asset) => (
                                        <option key={asset.id} value={asset.id}>
                                            {asset.symbol} - {asset.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Fecha Fin</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ag-theme-alpine-dark h-full rounded-lg overflow-hidden border border-dark-border">
                    <AgGridReact
                        ref={gridRef}
                        rowData={quotes}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            sortable: true,
                            resizable: true,
                        }}
                        animateRows={true}
                        suppressCellFocus={true}
                    />
                </div>
            </div>
        </Layout>
    );
}
