import { useRef, useCallback, useEffect } from 'react';
import Handsontable from 'handsontable';

interface UseHandsontableProps {
    data: any[];
    columns: any[];
    colHeaders?: string[] | boolean;
    settings?: Handsontable.GridSettings;
    onEdit?: (item: any) => void;
    onDelete?: (id: string) => void;
    onAction?: (action: string, item: any) => void;
}

export const useHandsontable = ({
    data,
    columns,
    colHeaders = true,
    settings = {},
    onEdit,
    onDelete,
    onAction
}: UseHandsontableProps) => {
    const hotInstanceRef = useRef<Handsontable | null>(null);

    // Ref for callbacks to avoid re-initialization
    const callbacksRef = useRef({ onEdit, onDelete, onAction });
    useEffect(() => {
        callbacksRef.current = { onEdit, onDelete, onAction };
    }, [onEdit, onDelete, onAction]);

    // Ref for data to be accessible within stale closures (init)
    const dataRef = useRef(data);
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Callback Ref to handle DOM lifecycle
    const containerRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            // Mount: Initialize Handsontable
            // Use setTimeout to completely decouple from current call stack and rendering phase
            setTimeout(() => {
                if (!node || hotInstanceRef.current) return; // Node gone or already init with double-check

                const defaultSettings: Handsontable.GridSettings = {
                    data: [], // Init empty to reduce initial blocking time (split task)
                    columns: columns,
                    colHeaders: colHeaders,

                    // STANDARD DEFAULTS (Optimized)
                    rowHeaders: true,
                    height: '100%',
                    width: '100%',
                    stretchH: 'all',
                    manualColumnResize: true,
                    autoRowSize: false, // Performance boost
                    autoColumnSize: false, // Performance boost - rely on defined widths or CSS
                    renderAllRows: false, // Virtualization enabled (default)
                    
                    licenseKey: 'non-commercial-and-evaluation',
                    columnSorting: true,
                    filters: true,
                    dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
                    
                    // Styles controlled purely by handsontable-custom.css
                    className: 'handsontable-custom', 
                    themeName: 'ht-theme-main', // Suppress deprecated warning for v17+
                    rowHeights: 28,
                };

                const mergedSettings = { ...defaultSettings, ...settings };
                hotInstanceRef.current = new Handsontable(node, mergedSettings);

                // Add Click Listener
                const handleTableClick = (e: MouseEvent) => {
                    const target = e.target as HTMLElement;
                    const btn = target.closest('button'); // Look for button
                    if (!btn) return;

                    const action = btn.dataset.action; // Get action from data attribute
                    if (!action) return;

                    const td = target.closest('td');
                    if (!td) return;

                    const instance = hotInstanceRef.current;
                    if (!instance) return;

                    const coords = instance.getCoords(td as HTMLTableCellElement);
                    if (!coords || coords.row < 0) return;

                    const visualRow = coords.row;
                    const physicalRow = instance.toPhysicalRow(visualRow);
                    const rowData = instance.getSourceDataAtRow(physicalRow);

                    if (rowData) {
                        if (action === 'edit' && callbacksRef.current.onEdit) {
                            callbacksRef.current.onEdit(rowData);
                        } else if (action === 'delete' && callbacksRef.current.onDelete) {
                            const id = (rowData as any).id;
                            if (id) {
                                callbacksRef.current.onDelete(id);
                            }
                        }

                        if (callbacksRef.current.onAction) {
                            callbacksRef.current.onAction(action, rowData);
                        }
                    }
                };

                node.addEventListener('click', handleTableClick);
                (hotInstanceRef.current as any)._customClickListener = handleTableClick;

                // Load initial data in the next frame to split the main thread work
                // Use dataRef to ensure we access the LATEST data, not the stale one from closure
                if (dataRef.current && dataRef.current.length > 0) {
                    requestAnimationFrame(() => {
                        hotInstanceRef.current?.loadData(dataRef.current);
                    });
                }
            });

        } else {
            // Unmount: Destroy Handsontable
            if (hotInstanceRef.current) {
                const instance = hotInstanceRef.current as any;
                if (instance.rootElement && instance._customClickListener) {
                    instance.rootElement.removeEventListener('click', instance._customClickListener);
                }
                hotInstanceRef.current.destroy();
                hotInstanceRef.current = null;
            }
        }
    }, []);

    // Efficiently update data 
    useEffect(() => {
        if (hotInstanceRef.current) {
            hotInstanceRef.current.loadData(data);
        }
    }, [data]);

    // Efficiently update settings
    useEffect(() => {
        if (hotInstanceRef.current) {
            hotInstanceRef.current.updateSettings({
                columns: columns,
                colHeaders: colHeaders,
                ...settings
            });
        }
    }, [columns, colHeaders, settings]);


    return {
        containerRef,
        hotInstance: hotInstanceRef
    };
};
