import { useEffect, useRef, useCallback } from 'react';
import Handsontable from 'handsontable';
import 'handsontable/styles/ht-theme-main.min.css';

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
    const containerRef = useRef<HTMLDivElement>(null);
    const hotInstanceRef = useRef<Handsontable | null>(null);

    // Ref for data to avoid stale closures in listeners
    const dataRef = useRef(data);
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Ref for callbacks to avoid re-initialization
    const callbacksRef = useRef({ onEdit, onDelete, onAction });
    useEffect(() => {
        callbacksRef.current = { onEdit, onDelete, onAction };
    }, [onEdit, onDelete, onAction]);

    const initializeHandsontable = useCallback(() => {
        if (!containerRef.current) return;

        if (hotInstanceRef.current) {
            hotInstanceRef.current.destroy();
        }

        const defaultSettings: Handsontable.GridSettings = {
            data: data, // Initial data
            columns: columns,
            colHeaders: colHeaders,
            rowHeaders: true,
            height: '100%',
            width: '100%',
            stretchH: 'all',
            autoWrapRow: true,
            autoWrapCol: true,
            licenseKey: 'non-commercial-and-evaluation',
            columnSorting: true,
            filters: true,
            dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
            themeName: 'ht-theme-main',
            className: 'handsontable-dark',
            // Default row height for consistency
            rowHeights: 28,
            manualColumnResize: true,
        };

        const mergedSettings = { ...defaultSettings, ...settings };

        hotInstanceRef.current = new Handsontable(containerRef.current, mergedSettings);
    }, [columns, colHeaders, settings, data]); // Added data to deps for initial load

    // Initialize or update data
    useEffect(() => {
        if (!hotInstanceRef.current) {
            initializeHandsontable();
        } else {
            hotInstanceRef.current.updateSettings({
                data: data,
                columns: columns, // In case columns change dynamically
                ...settings
            });
            // Force render might be needed in some cases but updateSettings usually handles it
            hotInstanceRef.current.render();
        }
    }, [data, initializeHandsontable, columns, settings]);

    // Click handler for actions
    useEffect(() => {
        const tableElement = containerRef.current;
        if (!tableElement) return;

        const handleTableClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('button');
            if (!btn) return;

            const action = btn.dataset.action;
            if (!action) return;

            const td = target.closest('td');
            if (!td) return;

            const instance = hotInstanceRef.current;
            if (!instance) return;

            const coords = instance.getCoords(td as HTMLTableCellElement);
            if (!coords || coords.row < 0) return;

            // Get standard row data (source data)
            // Note: If sorting is active, visual row != physical row. 
            // getSourceDataAtRow uses physical index if passed a number?
            // Actually getSourceDataAtRow(row) takes visual row index and returns source data object in v12+?
            // Let's verify standard usage. usually toPhysicalRow helps.
            // But getSourceDataAtRow accepts visual row index in recent versions.

            // However, to be safe and consistent with previous implementation:
            const visualRow = coords.row;
            const physicalRow = instance.toPhysicalRow(visualRow);
            const rowData = instance.getSourceDataAtRow(physicalRow); // or just sourceData[physicalRow]

            if (rowData) {
                if (action === 'edit' && callbacksRef.current.onEdit) {
                    callbacksRef.current.onEdit(rowData);
                } else if (action === 'delete' && callbacksRef.current.onDelete) {
                    // Check if 'id' exists on rowData
                    const id = (rowData as any).id;
                    if (id) {
                        callbacksRef.current.onDelete(id);
                    }
                }

                // Generic action handler
                if (callbacksRef.current.onAction) {
                    callbacksRef.current.onAction(action, rowData);
                }
            }
        };

        tableElement.addEventListener('click', handleTableClick);
        return () => tableElement.removeEventListener('click', handleTableClick);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (hotInstanceRef.current) {
                hotInstanceRef.current.destroy();
                hotInstanceRef.current = null;
            }
        };
    }, []);

    return {
        containerRef,
        hotInstance: hotInstanceRef
    };
};
