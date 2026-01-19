import { useRef, useCallback, useEffect } from 'react';
import Handsontable from 'handsontable';
import { formatDate } from '../utils/formatters';

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

                    // Custom Copy/Paste behavior to respect user locale (Spanish)
                    beforeCopy: function(data: any[][], coords: any[]) {
                        // Use instance from ref or 'this' if bound correctly, but ref is safer in arrow/closure
                        const hot = hotInstanceRef.current;
                        if (!hot || !data || !coords || coords.length === 0) return;
                        
                        // Handle first selection range
                        const range = coords[0];
                        // Normalize range coordinates (handle generic objects or Range objects)
                        const startRow = (range.startRow !== undefined) ? range.startRow : (range.from ? range.from.row : 0);
                        const endRow = (range.endRow !== undefined) ? range.endRow : (range.to ? range.to.row : 0);
                        const startCol = (range.startCol !== undefined) ? range.startCol : (range.from ? range.from.col : 0);
                        const endCol = (range.endCol !== undefined) ? range.endCol : (range.to ? range.to.col : 0);

                        const minRow = Math.min(startRow, endRow);
                        const minCol = Math.min(startCol, endCol);

                        for (let i = 0; i < data.length; i++) {
                            for (let j = 0; j < data[i].length; j++) {
                                // Safety check for data array dimensions
                                if (i >= data.length || j >= data[i].length) continue;

                                const row = minRow + i;
                                const col = minCol + j;
                                
                                const meta = hot.getCellMeta(row, col);
                                const rawValue = hot.getDataAtCell(row, col);
                                const prop = String(meta.prop || '');

                                if (rawValue === null || rawValue === undefined) {
                                    data[i][j] = '';
                                    continue;
                                }

                                // Apply formatting logic based on property name or value type
                                const lowerProp = prop.toLowerCase();

                                // 1. Dates
                                if (lowerProp.includes('date') || lowerProp.includes('fecha') || (typeof rawValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawValue))) {
                                    data[i][j] = formatDate(rawValue);
                                } 
                                // 2. Integer Fields (ID, Year, Days) - Pass through string
                                else if (lowerProp.includes('year') || lowerProp.includes('id') || prop === 'days_held') {
                                    data[i][j] = String(rawValue);
                                }
                                // 3. Exchange Rates (6 decimals) - High Priority check before generic number
                                else if (lowerProp.includes('rate') || lowerProp.includes('tasa') || lowerProp.includes('exchange')) {
                                     const num = Number(rawValue);
                                     if (!isNaN(num)) {
                                         data[i][j] = num.toFixed(6).replace('.', ',');
                                     } else {
                                         data[i][j] = String(rawValue);
                                     }
                                }
                                // 4. Quantities (0-8 decimals - preserve raw precision but force comma)
                                else if (lowerProp.includes('quantity') || lowerProp.includes('shares') || lowerProp.includes('ctd')) {
                                    data[i][j] = String(rawValue).replace('.', ',');
                                }
                                // 5. Generic Numbers (Prices, Values, etc.) -> Force 2 decimals
                                else if (typeof rawValue === 'number') {
                                     const fixed = rawValue.toFixed(2);
                                     data[i][j] = fixed.replace('.', ',');
                                }
                                // 6. Catch-all for numeric strings meant to be prices
                                else if (!isNaN(Number(rawValue)) && rawValue !== '' && rawValue !== null) {
                                     const num = Number(rawValue);
                                     // Default to 2 decimals for currency-like strings
                                     const fixed = num.toFixed(2);
                                     data[i][j] = fixed.replace('.', ',');
                                }
                                // 3. Catch-all for numeric strings that might have slipped through
                                else if (!isNaN(Number(rawValue)) && rawValue !== '' && rawValue !== null && rawValue !== undefined) {
                                     const num = Number(rawValue);
                                     // Assume currency/price if uncertain
                                      const fixed = num.toFixed(2);
                                      data[i][j] = fixed.replace('.', ',');
                                }
                            }
                        }
                    }
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
