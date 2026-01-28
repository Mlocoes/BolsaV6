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
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AssetManagementData | null>(null);
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
        try {
            const url = filter ? `/assets/management/list?status_filter=${filter}` : '/assets/management/list';
            const response = await api.get(url);
            setData(response.data);
            setActiveFilter(filter || null);
        } catch (error: any) {
            console.error('Error loading assets:', error);
            toast.error(error.response?.data?.detail || 'Error al cargar activos');
        } finally {
            setLoading(false);
        }
    };

    const statusRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any) => {
        const reason = value?.reason || 'no_data';
        const statusConfig: any = {
            'no_data': { color: 'text-red-400', icon: '🔴', label: 'Sin datos' },
            'incomplete_data': { color: 'text-yellow-400', icon: '🟡', label: 'Incompleto' },
            'outdated': { color: 'text-orange-400', icon: '🟠', label: 'Desactualizado' },
            'complete': { color: 'text-green-400', icon: '🟢', label: 'Completo' }
        };
        const status = statusConfig[reason] || statusConfig['no_data'];
        td.innerHTML = `<span class="${status.color} font-bold text-xs">${status.icon} ${status.label}</span>`;
        td.className = 'htLeft';
        return td;
    };

    const syncRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: boolean) => {
        td.innerHTML = value ? '<span class="text-green-400 font-bold">✅</span>' : '<span class="text-red-400 font-bold">❌</span>';
        td.className = 'htCenter';
        return td;
    };

    const percentRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any) => {
        const pct = value ? (value * 100).toFixed(1) : '0.0';
        td.innerHTML = `${pct}%`;
        td.className = 'htRight';
        if (parseFloat(pct) < 50) td.style.color = '#f87171';
        else if (parseFloat(pct) < 94) td.style.color = '#fb923c';
        else td.style.color = '#4ade80';
        return td;
    };

    const columns = useMemo(() => [
        { data: 'symbol', title: 'Símbolo', width: 120, className: 'htLeft font-mono font-bold text-white' },
        { data: 'name', title: 'Nombre', width: 300, className: 'htLeft text-dark-muted' },
        { data: 'asset_type', title: 'Tipo', width: 80, className: 'htCenter text-xs' },
        { data: 'coverage', title: 'Estado', width: 140, renderer: statusRenderer },
        { data: 'coverage.total_quotes', title: 'Cotiz.', width: 80, className: 'htRight' },
        { data: 'coverage.last_date', title: 'Última', width: 110, className: 'htCenter text-dark-muted' },
        { data: 'coverage.days_since_last_update', title: 'Días', width: 60, className: 'htRight' },
        { data: 'coverage.coverage_ratio', title: 'Cobertura', width: 90, renderer: percentRenderer },
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

    if (!data) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

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
            <div className="bg-dark-surface border border-dark-border rounded-lg flex-1 min-h-0 overflow-hidden">
                <HotTable
                    ref={hotRef}
                    data={data.assets}
                    columns={columns}
                    colHeaders={columns.map(c => c.title)}
                    rowHeaders={true}
                    height="100%"
                    width="100%"
                    stretchH="all"
                    autoWrapRow={true}
                    autoWrapCol={true}
                    licenseKey="non-commercial-and-evaluation"
                    columnSorting={true}
                    filters={true}
                    dropdownMenu={['filter_by_condition', 'filter_by_value', 'filter_action_bar']}
                    readOnly={true}
                    themeName='ht-theme-main'
                    className="handsontable-dark"
                />
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
