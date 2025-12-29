import { formatCurrency, formatPercent, formatQuantity } from './formatters';
export { formatCurrency, formatPercent, formatQuantity };

/**
 * Custom Renderers for Handsontable
 */

// Text Renderer (Default with dark mode classes handled by CSS, but explicit if needed)
export const textRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any, _cellProperties: any) => {
    td.textContent = value === null || value === undefined ? '' : String(value);
    td.className = 'htLeft';
    return td;
};

// Numeric Renderer using our formatters
export const currencyRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any, _cellProperties: any) => {
    const formatted = formatCurrency(value);
    td.textContent = formatted;
    td.className = 'htRight';
    td.style.textAlign = 'right';
    return td;
};

export const percentRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any, _cellProperties: any) => {
    const formatted = formatPercent(value);
    td.textContent = formatted;
    td.className = 'htRight';
    td.style.textAlign = 'right';
    return td;
};

export const numberRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any, _cellProperties: any) => {
    const formatted = formatQuantity(value);
    td.textContent = formatted;
    td.className = 'htRight';
    td.style.textAlign = 'right';
    return td;
};

/**
 * Configuration Interface for Actions
 */
export interface ActionConfig {
    name: 'edit' | 'delete' | 'view' | 'custom';
    label?: string;
    icon?: string; // Emoji character
    tooltip?: string;
    className?: string; // 'edit', 'delete', 'view', or custom class
    callback?: (data: any) => void;
}

/**
 * Generates the HTML for the Action Buttons
 * @param actions List of actions to render
 */
export const getActionRenderer = (actions: ActionConfig[]) => {
    return (instance: any, td: HTMLElement, row: number, col: number, prop: string | number, value: any, cellProperties: any) => {
        const rowData = instance.getSourceDataAtRow(row);

        // Clear content
        while (td.firstChild) {
            td.removeChild(td.firstChild);
        }

        const container = document.createElement('div');
        container.className = 'actions-cell-container';

        actions.forEach(action => {
            const btn = document.createElement('button');

            // Set basic stylings
            let btnClass = 'action-btn';
            if (action.name === 'edit') btnClass += ' edit';
            else if (action.name === 'delete') btnClass += ' delete';
            else if (action.name === 'view') btnClass += ' view';
            else btnClass += ' custom ' + (action.className || '');

            btn.className = btnClass;
            btn.innerHTML = action.icon || (action.name === 'edit' ? '✏️' : action.name === 'delete' ? '🗑️' : action.name === 'view' ? '👁️' : '🔘');
            btn.title = action.tooltip || action.label || action.name;

            // Store metadata on the button to identify it later in the global click handler if needed
            // But better, we rely on the component using this to handle the click via the Grid's hooks
            // or we can attach a direct listener here (careful with memory, but HT re-renders often)
            // Ideally, we depend on 'afterOnCellMouseDown' in the component, identifying the target.
            // So we add a data-action attribute.
            btn.dataset.action = action.name;
            // For custom actions we might need an index or ID if names collide, but usually name/label is enough
            if (action.name === 'custom') {
                btn.dataset.label = action.label; // differentiator
            }

            container.appendChild(btn);
        });

        td.appendChild(container);
        td.className = 'htCenter';
        return td;
    };
};
