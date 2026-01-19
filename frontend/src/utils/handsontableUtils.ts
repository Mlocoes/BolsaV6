import { formatCurrency, formatPercent, formatQuantity, formatDate, formatPrice } from './formatters';
export { formatCurrency, formatPercent, formatQuantity, formatDate, formatPrice };

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

export const priceRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any, _cellProperties: any) => {
    const formatted = formatPrice(value);
    td.textContent = formatted;
    td.className = 'htRight';
    td.style.textAlign = 'right';
    return td;
};

export const dateRenderer = (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, value: any, _cellProperties: any) => {
    const formatted = formatDate(value);
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
    return (_instance: any, td: HTMLElement, _row: number, _col: number, _prop: string | number, _value: any, _cellProperties: any) => {
        // Use InnerHTML for better performance than creating DOM nodes
        const buttonsHtml = actions.map(action => {
            let btnClass = 'action-btn';
            if (action.name === 'edit') btnClass += ' edit';
            else if (action.name === 'delete') btnClass += ' delete';
            else if (action.name === 'view') btnClass += ' view';
            else btnClass += ' custom ' + (action.className || '');

            const icon = action.icon || (action.name === 'edit' ? '✏️' : action.name === 'delete' ? '🗑️' : action.name === 'view' ? '👁️' : '🔘');
            const title = action.tooltip || action.label || action.name;
            
            // data-action attribute is used by the global click handler in useHandsontable
            return `<button class="${btnClass}" data-action="${action.name}" title="${title}">${icon}</button>`;
        }).join('');

        td.innerHTML = `<div class="actions-cell-container">${buttonsHtml}</div>`;
        td.className = 'htCenter htMiddle'; // Ensure alignment classes
        return td;
    };
};
