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

    const columnDefs: ColDef[] = [
        {
            field: 'date',
            headerName: 'Fecha',
            width: 150,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '-'
        },
        {
            field: 'open',
            headerName: 'Apertura',
            width: 120,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'high',
            headerName: 'Máximo',
            width: 120,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'low',
            headerName: 'Mínimo',
            width: 120,
            valueFormatter: (params) => formatCurrency(params.value)
        },
        {
            field: 'close',
            headerName: 'Cierre',
            width: 120,
            valueFormatter: (params) => formatCurrency(params.value),
            cellStyle: { fontWeight: 'bold' }
        },
        {
            field: 'volume',
            headerName: 'Volumen',
            width: 150,
            valueFormatter: (params) => formatQuantity(params.value)
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
            toast.error('Error al cargar los activos. Por favor, inténtelo de nuevo.');
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
            toast.error('Error al cargar las cotizaciones. Por favor, inténtelo de nuevo.');
        }
    };

    return (
        <Layout>
            <div className="p-6 h-full flex flex-col">
                <h1 className="text-3xl font-bold mb-4">Cotizaciones</h1>

                <div className="flex space-x-4 mb-4">
                    <select
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                        className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                    >
                        <option value="">Todos los activos</option>
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
                        className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                    />

                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                    />
                </div>

                <div className="ag-theme-quartz-dark rounded-lg border border-dark-border" style={{ width: '100%', flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <AgGridReact
                        ref={gridRef}
                        rowData={quotes}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            sortable: true,
                            resizable: true,
                            filter: true,
                        }}
                        pagination={true}
                        paginationPageSize={50}
                        animateRows={true}
                        suppressCellFocus={true}
                        domLayout='normal'
                        containerStyle={{ height: '100%', width: '100%' }}
                    />
                </div>
            </div>
        </Layout>
    );
}
