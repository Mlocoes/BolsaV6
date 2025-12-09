/**
 * Página de Catálogo de Activos con AG Grid
 */
import { useEffect, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import Layout from '../components/Layout';
import api from '../services/api';

interface Asset {
    id: string;
    symbol: string;
    name: string;
    asset_type: string;
    currency: string;
    market: string;
}

export default function Assets() {
    const gridRef = useRef<AgGridReact>(null);
    const [assets, setAssets] = useState<Asset[]>([]);

    const columnDefs: ColDef[] = [
        { field: 'symbol', headerName: 'Símbolo', width: 120, filter: true, sort: 'asc' },
        { field: 'name', headerName: 'Nombre', flex: 1, filter: true },
        { field: 'asset_type', headerName: 'Tipo', width: 120, filter: true },
        { field: 'currency', headerName: 'Moneda', width: 100 },
        { field: 'market', headerName: 'Mercado', width: 120 },
        {
            headerName: 'Acciones',
            width: 200,
            cellRenderer: (params: any) => (
                <div className="flex space-x-2 h-full items-center">
                    <button
                        onClick={() => handleFetchQuotes(params.data.id, params.data.symbol)}
                        className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-sm"
                    >
                        Importar
                    </button>
                    <button
                        onClick={() => handleDelete(params.data.id)}
                        className="bg-danger hover:bg-danger/80 text-white px-3 py-1 rounded text-sm"
                    >
                        Eliminar
                    </button>
                </div>
            ),
        },
    ];

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        try {
            const response = await api.get('/assets');
            setAssets(response.data);
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    };

    const handleFetchQuotes = async (assetId: string, symbol: string) => {
        try {
            await api.post(`/quotes/asset/${assetId}/fetch-history`);
            alert(`Importación de historial iniciada para ${symbol}`);
        } catch (error) {
            console.error('Error fetching quotes:', error);
            alert('Error al importar cotizaciones');
        }
    };

    const handleDelete = async (assetId: string) => {
        if (!confirm('¿Estás seguro de eliminar este activo?')) return;

        try {
            await api.delete(`/assets/${assetId}`);
            loadAssets();
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Error al eliminar activo');
        }
    };

    return (
        <Layout>
            <div className="space-y-4 h-[calc(100vh-12rem)]">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Catálogo de Activos</h1>
                    <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg">
                        + Nuevo Activo
                    </button>
                </div>

                <div className="ag-theme-alpine-dark h-full rounded-lg overflow-hidden border border-dark-border">
                    <AgGridReact
                        ref={gridRef}
                        rowData={assets}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            sortable: true,
                            resizable: true,
                        }}
                        animateRows={true}
                        rowSelection="single"
                        suppressCellFocus={true}
                    />
                </div>
            </div>
        </Layout>
    );
}
