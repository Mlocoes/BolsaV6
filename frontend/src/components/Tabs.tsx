/**
 * Componente de Pestañas Reutilizable
 */
import { ReactNode } from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: string;
    content: ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Tab Headers */}
            <div className="flex border-b border-dark-border bg-dark-surface px-3 pt-2 flex-none">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            px-4 py-2 text-sm font-medium transition-all relative
                            ${activeTab === tab.id
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-dark-muted hover:text-white border-b-2 border-transparent hover:border-dark-border'
                            }
                        `}
                    >
                        {tab.icon && <span className="mr-2">{tab.icon}</span>}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {tabs.find(tab => tab.id === activeTab)?.content}
            </div>
        </div>
    );
}
