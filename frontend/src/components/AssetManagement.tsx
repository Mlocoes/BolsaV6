/**
 * Componente de Gestión de Activos
 * Permite gestionar el estado de sincronización de activos
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { HotTable } from '@handsontable/react';
import { toast } from 'react-toastify';
import api from '../services/api';

interface AssetManagementData {
    assets: any[];
    stats: {
        no_data: number;
        incomplete_data: number;
        outdated: number;
        complete: number;
        inactive: number;
    };
    total: number;
}

export default function AssetManagement() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AssetManagementData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'activate' | 'deactivate', assetIds: string[] } | null>(null);
    
    const hotRef = useRef<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (filter?: string) => {
        setLoading(true);
        setError(null);
        try {
            const url = filter ? `/assets/management/list?status_filter=${filter}` : '/assets/management/list';
            console.log('AssetManagement: Fetching data from', url);
            const response = await api.get(url);
            console.log('AssetManagement: Data received:', {
                total: response.data.total,
                assets_count: response.data.assets?.length,
                stats: response.data.stats,
                first_asset: response.data.assets?.[0],
                full_data: response.data
            });
            console.log('AssetManagement: First asset detailed:', JSON.stringify(response.data.assets?.[0], null, 2));
            setData(response.data);
            setActiveFilter(filter || null);
        } catch (error: any) {
            console.error('AssetManagement: Error loading assets:', error);
            const errorMsg = error.response?.data?.detail || error.message || 'Error al cargar activos';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Renderers personalizados
    const statusRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any) => {
        const reason = value?.reason || 'no_data';
        const statusConfig: any = {
            'no_data': { color: '#ef4444', icon: '🔴', label: 'Sin datos' },
            'incomplete_data': { color: '#fbbf24', icon: '🟡', label: 'Incompleto' },
            'outdated': { color: '#fb923c', icon: '🟠', label: 'Desactualizado' },
            'complete': { color: '#4ade80', icon: '🟢', label: 'Completo' }
        };
        const status = statusConfig[reason] || statusConfig['no_data'];
        td.innerHTML = `<div style="display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 12px; color: ${status.color};">
            <span style="font-size: 14px;">${status.icon}</span>
            <span>${status.label}</span>
        </div>`;
        td.style.textAlign = 'left';
        td.style.verticalAlign = 'middle';
        return td;
    };

    const syncRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: boolean) => {
        td.innerHTML = `<div style="text-align: center; font-size: 18px; font-weight: bold;">
            ${value ? '<span style="color: #4ade80;">✅</span>' : '<span style="color: #ef4444;">❌</span>'}
        </div>`;
        td.style.textAlign = 'center';
        td.style.verticalAlign = 'middle';
        return td;
    };

    const percentRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any) => {
        const pct = value ? (value * 100).toFixed(1) : '0.0';
        let color = '#4ade80';
        if (parseFloat(pct) < 50) color = '#ef4444';
        else if (parseFloat(pct) < 94) color = '#fb923c';
        
        td.innerHTML = `<div style="text-align: right; font-weight: 600; color: ${color}; font-size: 13px;">
            ${pct}%
        </div>`;
        td.style.textAlign = 'right';
        td.style.verticalAlign = 'middle';
        return td;
    };

    const numericRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any) => {
        td.innerHTML = `<div style="text-align: right; font-weight: 500; color: #e5e7eb; font-size: 13px;">
            ${value || 0}
        </div>`;
        td.style.textAlign = 'right';
        td.style.verticalAlign = 'middle';
        return td;
    };

    const dateRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any) => {
        td.innerHTML = `<div style="text-align: center; color: #9ca3af; font-size: 12px; font-family: 'Courier New', monospace;">
            ${value || '-'}
        </div>`;
        td.style.textAlign = 'center';
        td.style.verticalAlign = 'middle';
        return td;
    };

    const columns = useMemo(() => [
        { 
            data: 'symbol', 
            title: 'Símbolo', 
            width: 120,
            className: 'htLeft',
            renderer: (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any) => {
                td.innerHTML = `<div style="font-family: 'Courier New', monospace; font-weight: bold; color: #60a5fa; font-size: 13px;">${value}</div>`;
                td.style.textAlign = 'left';
                td.style.verticalAlign = 'middle';
                return td;
            }
        },
        { 
            data: 'name', 
            title: 'Nombre', 
            width: 350,
            className: 'htLeft',
            renderer: (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any) => {
                td.innerHTML = `<div style="color: #d1d5db; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${value}</div>`;
                td.style.textAlign = 'left';
                td.style.verticalAlign = 'middle';
                return td;
            }
        },
        { 
            data: 'asset_type', 
            title: 'Tipo', 
            width: 90,
            className: 'htCenter',
            renderer: (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any) => {
                const types: any = {
                    'stock': { label: 'Stock', color: '#3b82f6' },
                    'fund': { label: 'Fondo', color: '#8b5cf6' },
                    'crypto': { label: 'Crypto', color: '#f59e0b' },
                    'currency': { label: 'Divisa', color: '#10b981' }
                };
                const type = types[value] || { label: value, color: '#6b7280' };
                td.innerHTML = `<div style="display: inline-block; padding: 3px 8px; background: ${type.color}20; border: 1px solid ${type.color}; border-radius: 4px; color: ${type.color}; font-size: 11px; font-weight: 600; text-transform: uppercase;">${type.label}</div>`;
                td.style.textAlign = 'center';
                td.style.verticalAlign = 'middle';
                return td;
            }
        },
        { data: 'coverage', title: 'Estado', width: 150, renderer: statusRenderer },
        { data: 'coverage.total_quotes', title: 'Cotiz.', width: 80, renderer: numericRenderer },
        { data: 'coverage.last_date', title: 'Última', width: 110, renderer: dateRenderer },
        { data: 'coverage.days_since_last_update', title: 'Días', width: 70, renderer: numericRenderer },
        { data: 'coverage.coverage_ratio', title: 'Cobertura', width: 100, renderer: percentRenderer },
        { data: 'sync_enabled', title: 'Sync', width: 70, renderer: syncRenderer }
    ], []);

    // TODO: Implement sync toggle via Handsontable afterChange hook
    // const handleSyncToggle = async (assetId: string, currentValue: boolean) => {
    //     try {
    //         await api.patch(`/assets/${assetId}/sync`, { sync_enabled: !currentValue });
    //         toast.success('Sincronización actualizada');
    //         loadData(activeFilter || undefined);
    //     } catch (error: any) {
    //         toast.error(error.response?.data?.detail || 'Error al actualizar');
    //     }
    // };

    const handleBulkAction = (action: 'activate' | 'deactivate') => {
        if (selectedRows.length === 0) {
            toast.warning('Selecciona al menos un activo');
            return;
        }

        const selectedAssets = selectedRows.map(idx => data?.assets[idx]).filter(Boolean);
        const assetIds = selectedAssets.map(a => a.id);

        setPendingAction({ type: action, assetIds });
        setShowConfirmModal(true);
    };

    const confirmBulkAction = async () => {
        if (!pendingAction) return;

        try {
            await api.post('/assets/bulk-sync', {
                asset_ids: pendingAction.assetIds,
                sync_enabled: pendingAction.type === 'activate'
            });
            
            toast.success(`${pendingAction.assetIds.length} activos actualizados`);
            setShowConfirmModal(false);
            setPendingAction(null);
            setSelectedRows([]);
            loadData(activeFilter || undefined);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Error en actualización masiva');
        }
    };

    const FilterChip = ({ label, count, status, icon }: any) => (
        <button
            onClick={() => status ? loadData(status) : loadData()}
            className={`
                px-3 py-1.5 rounded-full text-xs font-bold transition-all
                ${activeFilter === status 
                    ? 'bg-primary text-white' 
                    : 'bg-dark-bg border border-dark-border text-dark-muted hover:border-primary hover:text-white'
                }
            `}
        >
            {icon} {label} ({count})
        </button>
    );

    // Estados de carga y error
    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="text-red-400 text-2xl mb-2">⚠️</div>
                    <div className="text-white font-bold mb-2">Error al cargar datos</div>
                    <div className="text-dark-muted text-sm mb-4">{error}</div>
                    <button
                        onClick={() => loadData()}
                        className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded font-bold transition-all"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-dark-muted">No hay datos disponibles</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-dark-bg p-3 gap-3">
            {/* Header */}
            <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex-none">
                <h2 className="text-lg font-bold text-white mb-3">⚙️ Gestión de Activos y Sincronización</h2>
                
                {/* Filtros */}
                <div className="flex flex-wrap gap-2">
                    <FilterChip label="Todos" count={data.total} status={null} icon="📊" />
                    <FilterChip label="Sin Datos" count={data.stats.no_data} status="no_data" icon="🔴" />
                    <FilterChip label="Incompletos" count={data.stats.incomplete_data} status="incomplete_data" icon="🟡" />
                    <FilterChip label="Desactualizados" count={data.stats.outdated} status="outdated" icon="🟠" />
                    <FilterChip label="Completos" count={data.stats.complete} status="complete" icon="🟢" />
                    <FilterChip label="Inactivos" count={data.stats.inactive} status="inactive" icon="⛔" />
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-dark-surface border border-dark-border rounded-lg p-3">
                {data.assets && data.assets.length > 0 ? (
                    <HotTable
                        ref={hotRef}
                        data={data.assets}
                        columns={columns}
                        colHeaders={true}
                        rowHeaders={true}
                        height={450}
                        width="100%"
                        licenseKey="non-commercial-and-evaluation"
                        readOnly={true}
                        stretchH="all"
                        columnSorting={true}
                        filters={true}
                        dropdownMenu={['filter_by_condition', 'filter_by_value', 'filter_action_bar']}
                        rowHeights={40}
                    />
                ) : (
                    <div className="flex items-center justify-center" style={{ height: '450px' }}>
                        <div className="text-center text-dark-muted">
                            <div className="text-4xl mb-2">📊</div>
                            <div className="text-lg font-bold mb-1">No hay activos</div>
                            <div className="text-sm">No se encontraron activos con el filtro seleccionado</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex gap-2 justify-between flex-none">
                <div className="text-xs text-dark-muted flex items-center">
                    {selectedRows.length > 0 && `${selectedRows.length} activos seleccionados`}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => loadData(activeFilter || undefined)}
                        disabled={loading}
                        className="px-4 py-2 bg-dark-bg hover:bg-dark-border border border-dark-border text-white rounded text-xs font-bold uppercase transition-all disabled:opacity-50"
                    >
                        🔄 Refrescar
                    </button>
                    <button
                        onClick={() => handleBulkAction('deactivate')}
                        disabled={selectedRows.length === 0}
                        className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700 text-red-400 rounded text-xs font-bold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ❌ Desactivar Seleccionados
                    </button>
                    <button
                        onClick={() => handleBulkAction('activate')}
                        disabled={selectedRows.length === 0}
                        className="px-4 py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-700 text-green-400 rounded text-xs font-bold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ✅ Activar Seleccionados
                    </button>
                </div>
            </div>

            {/* Modal de Confirmación */}
            {showConfirmModal && pendingAction && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-dark-surface border border-dark-border rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-white mb-4">⚠️ Confirmar Cambios</h3>
                        <p className="text-dark-muted mb-4">
                            Vas a <span className="font-bold text-white">{pendingAction.type === 'activate' ? 'ACTIVAR' : 'DESACTIVAR'}</span> sincronización para <span className="font-bold text-primary">{pendingAction.assetIds.length}</span> activos.
                        </p>
                        <p className="text-xs text-dark-muted mb-6">
                            {pendingAction.type === 'deactivate' 
                                ? 'Estos activos NO importarán cotizaciones automáticamente.'
                                : 'Estos activos volverán a importar cotizaciones automáticamente.'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowConfirmModal(false); setPendingAction(null); }}
                                className="px-4 py-2 bg-dark-bg border border-dark-border text-white rounded hover:bg-dark-border transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmBulkAction}
                                className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded font-bold transition-all"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
