import React from 'react';

interface TableActionsProps {
    data: any;
    onEdit?: (data: any) => void;
    onDelete?: (id: any) => void;
    onView?: (data: any) => void;
    customActions?: {
        label: string;
        icon: string;
        onClick: (data: any) => void;
        className?: string;
        title?: string;
    }[];
}

const TableActions: React.FC<TableActionsProps> = ({ data, onEdit, onDelete, onView, customActions }) => {
    return (
        <div className="flex items-center gap-1 h-full">
            {onView && (
                <button
                    onClick={() => onView(data)}
                    className="p-1.5 rounded text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all font-bold"
                    title="Ver Detalles"
                >
                    👁️
                </button>
            )}

            {onEdit && (
                <button
                    onClick={() => onEdit(data)}
                    className="p-1.5 rounded text-yellow-500 hover:text-white hover:bg-yellow-500/20 transition-all font-bold"
                    title="Editar"
                >
                    ✏️
                </button>
            )}

            {customActions && customActions.map((action, idx) => (
                <button
                    key={idx}
                    onClick={() => action.onClick(data)}
                    className={`p-1.5 rounded hover:bg-opacity-20 transition-all font-bold ${action.className || 'text-dark-muted hover:text-white hover:bg-gray-500'}`}
                    title={action.title || action.label}
                >
                    {action.icon}
                </button>
            ))}

            {onDelete && (
                <button
                    onClick={() => onDelete(data.id)}
                    className="p-1.5 rounded text-red-500 hover:text-white hover:bg-red-500/20 transition-all font-bold"
                    title="Eliminar"
                >
                    🗑️
                </button>
            )}
        </div>
    );
};

export default TableActions;
