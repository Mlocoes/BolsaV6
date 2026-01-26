/**
 * Página de Dashboard
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import Layout from '../components/Layout';
import { formatCurrency, formatPercent, getCurrencySymbol } from '../utils/formatters';
import { useUser } from '../context/UserContext';
import { usePortfolioStore } from '../stores/portfolioStore';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function Dashboard() {
    const { user } = useUser();
    const { 
        portfolios, 
        selectedPortfolio, 
        dashboardStats: stats, 
        isRealTime, 
        lastSync,
        loadPortfolios, 
        selectPortfolio, 
        setRealTime 
    } = usePortfolioStore();

    const [loading, setLoading] = useState(true);

    // Obtener símbolo de moneda del usuario
    const currencySymbol = user ? getCurrencySymbol(user.base_currency) : '€';

    /**
     * Cargar carteras al inicio
     */
    useEffect(() => {
        const init = async () => {
            if (portfolios.length === 0) {
                await loadPortfolios();
            }
            setLoading(false);
        };
        init();
    }, []);

    /**
     * Activar tiempo real al montar el componente
     */
    useEffect(() => {
        setRealTime(true);
        return () => setRealTime(false);
    }, []);

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-full">
                    <div className="text-dark-muted">Cargando aplicación...</div>
                </div>
            </Layout>
        );
    }

    if (portfolios.length === 0) {
        return (
            <Layout>
                <div className="h-full flex flex-col items-center justify-center p-6">
                    <p className="text-dark-muted mb-4 text-lg">No tienes carteras creadas</p>
                    <Link
                        to="/portfolios"
                        className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg
                         transition-colors font-medium"
                    >
                        Crear mi primera cartera
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="h-full overflow-y-auto p-3 bg-dark-bg">
                <div className="space-y-3 max-w-full mx-auto">
                    {/* Header Row: Title & Selector inline */}
                    <div className="flex flex-row justify-between items-center bg-dark-surface p-3 rounded-lg border border-dark-border">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                📊 Dashboard
                            </h1>
                            {lastSync && (
                                <span className="text-[10px] text-dark-muted flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isRealTime ? 'bg-primary animate-pulse' : 'bg-green-500'}`}></span>
                                    Sincronizado: {lastSync.toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                        <div className="w-48">
                            <select
                                value={selectedPortfolio ? selectedPortfolio.id : ''}
                                onChange={(e) => selectPortfolio(e.target.value)}
                                className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                            >
                                <option value="all">Todas</option>
                                {portfolios.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!stats ? (
                        <div className="text-center py-20 text-dark-muted">Cargando estadísticas...</div>
                    ) : (
                        <>
                            {/* Summary Cards Row - Ultra Compact */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                                    <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Valor Total</h3>
                                    <div className="text-lg font-bold text-white leading-tight">
                                        {formatCurrency(stats.total_value)} {currencySymbol}
                                    </div>
                                </div>
                                <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                                    <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Invertido</h3>
                                    <div className="text-lg font-bold text-white leading-tight">
                                        {formatCurrency(stats.total_invested)} {currencySymbol}
                                    </div>
                                </div>
                                <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col justify-center">
                                    <h3 className="text-dark-muted text-[10px] uppercase tracking-wider font-semibold mb-0.5">Plusvalía</h3>
                                    <div className={`text-lg font-bold leading-tight ${stats.total_pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {stats.total_pl >= 0 ? '+' : ''}{formatCurrency(stats.total_pl)} {currencySymbol}
                                        <span className="text-xs ml-2 font-normal opacity-80">
                                            ({stats.total_pl >= 0 ? '+' : ''}{formatPercent(stats.total_pl_percentage)}%)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Grid: Top (Evolution) & Bottom (Distribution/Monthly) */}
                            {/* Reduced height from 180px to 220px subtraction to shrink vertically */}
                            <div className="grid grid-cols-12 gap-3 h-[calc(100vh_-_220px)] min-h-[350px]">

                                {/* Left Column: Evolution (Spans 8 cols) & Monthly (below) */}
                                <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
                                    {/* Evolution Chart */}
                                    <div className="bg-dark-surface border border-dark-border rounded-lg p-3 flex-1 min-h-[150px] flex flex-col transition-all">
                                        <h2 className="text-xs font-semibold mb-2 text-dark-muted">Evolución (Año Actual)</h2>
                                        <div className="flex-1 w-full min-h-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={stats.performance_history}>
                                                    <defs>
                                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="#9CA3AF"
                                                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                                                        minTickGap={50}
                                                        tick={{ fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        dy={5}
                                                    />
                                                    <YAxis
                                                        stroke="#9CA3AF"
                                                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                                        domain={['auto', 'auto']}
                                                        tick={{ fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        width={30}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', fontSize: '11px', padding: '4px 8px' }}
                                                        formatter={(value: number) => [formatCurrency(value) + ' ' + currencySymbol, '']}
                                                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#3B82F6"
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        fill="url(#colorValue)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Monthly Values (Smaller height) */}
                                    <div className="bg-dark-surface border border-dark-border rounded-lg p-3 h-36 flex flex-col">
                                        <h2 className="text-xs font-semibold mb-2 text-dark-muted">Valor Mensual</h2>
                                        <div className="flex-1 w-full min-h-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.monthly_values}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                                    <XAxis
                                                        dataKey="month"
                                                        stroke="#9CA3AF"
                                                        tickFormatter={(str) => str.split('-')[1]}
                                                        tick={{ fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#9CA3AF"
                                                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                                        tick={{ fontSize: 10 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        width={30}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', fontSize: '11px', padding: '4px 8px' }}
                                                        cursor={{ fill: '#374151', opacity: 0.2 }}
                                                        formatter={(value: number) => [formatCurrency(value) + ' ' + currencySymbol, '']}
                                                    />
                                                    <Bar dataKey="value" fill="#10B981" radius={[2, 2, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Asset Allocation (Spans 4 cols) - Full Height */}
                                <div className="col-span-12 lg:col-span-4 bg-dark-surface border border-dark-border rounded-lg p-3 flex flex-col">
                                    <h2 className="text-xs font-semibold mb-2 text-dark-muted">Distribución</h2>
                                    <div className="flex-1 w-full min-h-0 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.asset_allocation}
                                                    cx="50%"
                                                    cy="40%"
                                                    innerRadius="40%"
                                                    outerRadius="65%"
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {stats.asset_allocation.map((_entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6', fontSize: '11px', padding: '4px 8px' }}
                                                    formatter={(value: number, _name: string, props: any) => [
                                                        formatCurrency(value) + ' ' + currencySymbol,
                                                        props.payload.name
                                                    ]}
                                                />
                                                <Legend
                                                    formatter={(_value, entry: any) => (
                                                        <div className="flex justify-between w-full text-[10px] leading-tight mb-1">
                                                            <span className="truncate mr-2 max-w-[80px]" title={entry.payload.name}>{entry.payload.name}</span>
                                                            <span className="font-mono text-dark-muted">{formatPercent(entry.payload.percentage)}%</span>
                                                        </div>
                                                    )}
                                                    layout="horizontal"
                                                    align="center"
                                                    verticalAlign="bottom"
                                                    iconSize={8}
                                                    wrapperStyle={{ bottom: 0, left: 0, right: 0, fontSize: '10px' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* List of top assets text fallback or simple legend enhancement if needed */}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}
