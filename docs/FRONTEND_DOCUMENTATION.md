# 🎨 Documentación del Frontend - BolsaV6

## Índice
- [Visión General](#visión-general)
- [Arquitectura](#arquitectura)
- [Estructura de Directorios](#estructura-de-directorios)
- [Tecnologías](#tecnologías)
- [Pantallas y Componentes](#pantallas-y-componentes)
- [Servicios](#servicios)
- [Autenticación](#autenticación)
- [Estado Global](#estado-global)
- [Estilos y UI](#estilos-y-ui)
- [Configuración](#configuración)

---

## Visión General

El frontend de BolsaV6 es una aplicación moderna de página única (SPA) construida con **React 18** y **Vite**. Proporciona una interfaz intuitiva para gestionar carteras de inversión, visualizar cotizaciones y generar informes fiscales.

### Características Principales
- ⚡ Vite para desarrollo ultrarrápido (HMR)
- 🎨 Tailwind CSS para estilos modernos y responsive
- 📊 Recharts para gráficos interactivos
- 🔐 Autenticación basada en sesiones (cookies)
- 🌐 Comunicación con backend vía Axios
- 📱 Diseño responsive (desktop + tablet)
- 🎯 TypeScript para type safety

---

## Arquitectura

```
┌────────────────────────────────────────────────────┐
│              User Browser                          │
└──────────────────┬─────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────┐
│          React App (main.tsx)                      │
│                                                    │
│   ┌──────────────────────────────────────────┐   │
│   │         Router (react-router-dom)        │   │
│   │                                          │   │
│   │   /login        → Login                  │   │
│   │   /dashboard    → Dashboard              │   │
│   │   /portfolios   → Portfolios             │   │
│   │   /assets       → Assets                 │   │
│   │   /quotes       → Quotes                 │   │
│   │   /transactions → Transactions           │   │
│   │   /import       → Import                 │   │
│   │   /fiscal       → FiscalReport           │   │
│   │   /users        → Users (admin)          │   │
│   │   /settings     → Settings               │   │
│   └──────────────────────────────────────────┘   │
└────────────┬──────────────────┬──────────────────┘
             │                  │
             ▼                  ▼
    ┌────────────────┐  ┌──────────────────┐
    │   Zustand      │  │    Services      │
    │   Stores       │  │   • api.ts       │
    │  • authStore   │  │   • dashboardSvc │
    │  • portfolioSt │  │   • fiscalSvc    │
    └────────────────┘  └────────┬─────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Backend API    │
                        │  (FastAPI)      │
                        └─────────────────┘
```

---

## Estructura de Directorios

```
BolsaV6/
├── frontend/                 # Proyecto React (este directorio)
├── backend/                  # API FastAPI
├── docs/                     # Documentación global
├── scripts/                  # Scripts de utilidad
└── logs/                     # Logs del sistema

frontend/src/
├── main.tsx             # 🚀 Punto de entrada (Configuración de Handsontable y Estilos)
├── App.tsx              # Componente raíz con router
├── pages/               # 📄 Páginas/Pantallas
│   ├── FiscalReport.tsx # Informe fiscal (con renderers localizados)
│   ├── Settings.tsx     # Configuración (Layout compacto 3:2)
│   └── ...
├── components/          # 🧩 Componentes reutilizables
├── utils/               # 🛠️ Utilidades
│   └── formatters.ts    # Formateo es-ES (Comas decimales, Fechas DD/MM/YYYY)
└── styles/
    └── handsontable-custom.css # Tema oscuro agresivo para Handsontable
```

---

## Tecnologías

### Core
- **React**: 18.2.0 - Librería UI
- **TypeScript**: 5.0+ - Tipado estático
- **Vite**: 5.0+ - Build tool y dev server
- **React Router DOM**: 6.20+ - Enrutamiento

### UI/Estilos
- **Tailwind CSS**: 3.4+ - Utility-first CSS
- **Recharts**: 2.10+ - Gráficos interactivos
- **React Toastify**: 9.1+ - Notificaciones toast

### Estado y Datos
- **Zustand**: 4.4+ - State management ligero
- **Axios**: 1.6+ - Cliente HTTP
- **date-fns**: 2.30+ - Manipulación de fechas

### Desarrollo
- **ESLint**: Linting
- **Prettier**: Formateo de código
- **TypeScript ESLint**: Linting para TS

---

## Pantallas y Componentes

### 1. **Login** (`Login.tsx`)

🎯 **Propósito**: Autenticación de usuarios

**Características:**
- Formulario de login (username + password)
- Validación en frontend
- Redirección automática tras login
- Manejo de errores (credenciales inválidas)

**Flujo:**
```
1. Usuario ingresa credenciales
2. Submit → POST /api/auth/login
3. Si éxito: Guarda user en authStore y redirige a /dashboard
4. Si error: Muestra mensaje de error
```

**Código clave:**
```tsx
const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const response = await api.post('/auth/login', {
            username,
            password
        });
        
        setUser(response.data.user);
        navigate('/dashboard');
        toast.success('¡Bienvenido!');
    } catch (error) {
        toast.error('Credenciales inválidas');
    }
};
```

**Ruta**: `/login` (pública)

---

### 2. **Dashboard** (`Dashboard.tsx`)

🎯 **Propósito**: Resumen y estadísticas de carteras

**Características:**
- Selector de cartera
- Tarjetas de métricas principales:
  * Valor total
  * Valor invertido
  * Ganancia/Pérdida ($ y %)
- Gráfico de evolución temporal (AreaChart)
- Gráfico de distribución por activo (PieChart)
- Top gainers y top losers
- Tabla de posiciones actuales

**Secciones:**

1. **Header**: Selector de cartera + botón "Nueva Cartera"
2. **Métricas**: 4 tarjetas con stats principales
3. **Gráfico de Evolución**: Histórico de 30/90/365 días
4. **Distribución**: Pie chart con % por activo
5. **Posiciones**: Tabla con holdings actuales

**Servicios usados:**
```tsx
import { getDashboardStats } from '../services/dashboardService';

const stats = await getDashboardStats(portfolioId);
// stats.total_value, stats.positions, stats.history, etc.
```

**Ruta**: `/dashboard` (protegida)

---

### 3. **Portfolios** (`Portfolios.tsx`)

🎯 **Propósito**: Gestión CRUD de carteras

**Características:**
- Lista de todas las carteras del usuario
- Botón "Nueva Cartera"
- Modal para crear/editar cartera
- Botón eliminar con confirmación
- Ver detalle de cartera

**Operaciones:**

```tsx
// Listar
const response = await api.get('/portfolios/');

// Crear
await api.post('/portfolios/', {
    name: 'Mi Nueva Cartera',
    description: 'Descripción opcional'
});

// Editar
await api.patch(`/portfolios/${id}`, { name: 'Nuevo nombre' });

// Eliminar
await api.delete(`/portfolios/${id}`);
```

**Ruta**: `/portfolios` (protegida)

---

### 4. **Assets** (`Assets.tsx`)

🎯 **Propósito**: Catálogo de activos financieros

**Características:**
- Tabla con todos los activos
- Filtros por tipo (stock, crypto, etc.)
- Búsqueda por símbolo o nombre
- Modal para agregar nuevo activo
- Editar/eliminar activos
- Botón "Ver Cotizaciones"

**Campos de Activo:**
- Symbol (Ticker)
- Name
- Type (stock/crypto/etf)
- Currency
- Market

**Código:**
```tsx
// Listar activos
const response = await api.get('/assets/', {
    params: { asset_type: selectedType }
});

// Crear activo
await api.post('/assets/', {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    asset_type: 'stock',
    currency: 'USD',
    market: 'NASDAQ'
});
```

**Ruta**: `/assets` (protegida)

---

### 5. **Quotes** (`Quotes.tsx`)

🎯 **Propósito**: Consulta de cotizaciones históricas

**Características:**
- Selector de activo
- Filtro de rango de fechas
- Tabla con datos OHLCV
- Gráfico de velas (candlestick)
- Botón "Importar Histórico"
- Exportar a CSV/Excel

**Columnas de la tabla:**
- Fecha
- Apertura (Open)
- Máximo (High)
- Mínimo (Low)
- Cierre (Close)
- Volumen
- Fuente (polygon, yfinance)

**Código:**
```tsx
// Obtener cotizaciones
const response = await api.get(`/quotes/asset/${assetId}`, {
    params: {
        start_date: '2024-01-01',
        end_date: '2024-12-31'
    }
});
```

**Ruta**: `/quotes` (protegida)

---

### 6. **Transactions** (`Transactions.tsx`)

🎯 **Propósito**: Gestión de transacciones/operaciones

**Características:**
- Selector de cartera
- Filtro por activo y fechas
- Tabla con todas las transacciones
- Modal para agregar nueva transacción
- Editar/eliminar transacciones
- Badge con tipo de operación (BUY/SELL)

**Formulario de Transacción:**
```tsx
{
    asset_id: string,
    transaction_type: 'BUY' | 'SELL' | 'DIVIDEND',
    transaction_date: Date,
    quantity: number,
    price: number,
    fees: number,
    notes: string (opcional)
}
```

**Código:**
```tsx
// Crear transacción
await api.post(`/transactions/portfolio/${portfolioId}`, {
    asset_id: selectedAsset,
    transaction_type: 'BUY',
    transaction_date: new Date(),
    quantity: 100,
    price: 150.00,
    fees: 10.00
});
```

**Ruta**: `/transactions` (protegida)

---

### 7. **Positions** (`Positions.tsx`)

🎯 **Propósito**: Visualizar posiciones actuales de una cartera

**Características:**
- Selector de cartera
- Tabla con posiciones abiertas
- Columnas:
  * Símbolo
  * Nombre
  * Cantidad
  * Precio promedio
  * Precio actual
  * Valor de mercado
  * Costo base
  * P/L no realizado ($ y %)
  * Peso en cartera (%)

**Cálculos:**
```tsx
market_value = quantity × current_price
cost_basis = quantity × avg_price
unrealized_pl = market_value - cost_basis
unrealized_pl_percent = (unrealized_pl / cost_basis) × 100
weight = (market_value / total_portfolio_value) × 100
```

**Ruta**: `/positions` (protegida)

---

### 8. **Import** (`Import.tsx`)

🎯 **Propósito**: Importación de datos (transacciones y cotizaciones)

**Características:**

**Sección 1: Importar Transacciones desde Excel**
- Selector de cartera
- Upload de archivo Excel (.xlsx)
- Plantilla descargable
- Validación de formato
- Barra de progreso

**Sección 2: Importar Cotizaciones**
- Botón "Histórico de Cotizaciones"
- Modal con tabla de cobertura:
  * Estados: Sin datos, Incompleto, Desactualizado, Completo
  * Botón "Importar Faltantes"
  * Botón "Forzar Reimportar Todo"
  * Botón "Refrescar Estado"

**Formato Excel de Transacciones:**
```
| Fecha       | Tipo | Símbolo | Cantidad | Precio | Comisión | Notas |
|-------------|------|---------|----------|--------|----------|-------|
| 01/01/2024  | BUY  | AAPL    | 100      | 150.00 | 10.00    | ...   |
| 15/02/2024  | SELL | GOOGL   | 50       | 140.00 | 5.00     | ...   |
```

**Código Importación Masiva:**
```tsx
// Importar transacciones
const formData = new FormData();
formData.append('file', file);

await api.post(`/import/transactions/excel/${portfolioId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// Importar cotizaciones masivamente
await api.post('/quotes/import/bulk-historical', {
    asset_ids: selectedAssets,
    force_refresh: false
});
```

**Ruta**: `/import` (protegida)

---

### 9. **FiscalReport** (`FiscalReport.tsx`)

🎯 **Propósito**: Generar informe fiscal de plusvalías

**Características:**
- Selector de cartera
- Selector de año fiscal
- Botón "Generar Informe"
- Resumen ejecutivo:
  * Total ganancias
  * Total pérdidas
  * Resultado neto
- Tabla detallada de ventas:
  * Símbolo
  * Fecha de venta
  * Cantidad
  * Precio de venta
  * Costo base
  * Ganancia/Pérdida
  * Wash sale (Sí/No)
- Exportar a PDF

**Mejoras Recientes (v6.1):**
- **Formateo Localizado**: Uso estricto de `es-ES`.
- **Decimales**: Coma (`,`) como separador.
- **Precisión**: 4 decimales para precios unitarios, 2 para totales.
- **Fechas**: Formato `DD/MM/YYYY`.
- **Filtros**: El menú de filtrado de Handsontable ahora soporta tema oscuro completo.

**Cálculo:**
- Método FIFO (First In, First Out)
- Wash Sale Rule (30 días)
- Incluye comisiones en costo base

**Código:**
```tsx
const response = await api.get('/fiscal/calculate', {
    params: {
        portfolio_id: portfolioId,
        year: selectedYear
    }
});

const { total_gain, total_loss, net_result, items } = response.data;
```

**Ruta**: `/fiscal-report` (protegida)

---

### 10. **Users** (`Users.tsx`)

🎯 **Propósito**: Administración de usuarios (solo admin)

**Características:**
- Tabla con todos los usuarios
- Crear nuevo usuario
- Editar usuario (cambiar password, permisos)
- Activar/desactivar usuario
- Eliminar usuario
- Badge "Admin" para administradores

**Campos:**
- Username
- Email
- Activo (Sí/No)
- Admin (Sí/No)
- Moneda base
- Fecha de creación

**Ruta**: `/users` (protegida, solo admin)

---

### 11. **Settings** (`Settings.tsx`)

🎯 **Propósito**: Configuración de usuario

**Características:**
- Cambiar moneda base (EUR, USD, BRL, GBP)
- Cambiar contraseña
- Preferencias de visualización
- Cerrar sesión

**Diseño v6.1**:
- **Layout 3:2**: Aprovechamiento máximo del espacio vertical.
- **Selector Compacto**: Selector de moneda optimizado para mayor legibilidad.
- **Integración de Perfil**: Email y moneda unificados.

**Ruta**: `/settings` (protegida)

---

### 12. **Administration** (`Administration.tsx`)

🎯 **Propósito**: Panel de administración del sistema

**Características:**
- Estadísticas del sistema:
  * Total de usuarios
  * Total de activos
  * Total de transacciones
  * Total de cotizaciones
- Tareas de mantenimiento:
  * Sincronizar cotizaciones ahora
  * Limpiar cache de Redis
  * Ver logs del sistema
- Gestión de mercados

**Ruta**: `/administration` (protegida, solo admin)

---

## Componentes Reutilizables

### **Layout** (`Layout.tsx`)

Envuelve todas las páginas protegidas con navegación.

**Estructura:**
```tsx
<Layout>
    <Navbar>
        <Logo />
        <UserMenu />
    </Navbar>
    
    <Sidebar>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/portfolios">Carteras</NavLink>
        <NavLink to="/assets">Activos</NavLink>
        ...
    </Sidebar>
    
    <MainContent>
        {children}
    </MainContent>
</Layout>
```

**Props:**
```tsx
interface LayoutProps {
    children: ReactNode;
}
```

---

### **Modal** (`Modal.tsx`)

Modal genérico reutilizable.

**Uso:**
```tsx
<Modal
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    title="Nuevo Activo"
    size="large"
>
    <FormContent />
</Modal>
```

**Props:**
```tsx
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'small' | 'medium' | 'large';
}
```

---

### **ProtectedRoute** (`ProtectedRoute.tsx`)

HOC para proteger rutas que requieren autenticación.

**Uso:**
```tsx
<Route
    path="/dashboard"
    element={
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
    }
/>
```

**Lógica:**
```tsx
const ProtectedRoute = ({ children }) => {
    const { user } = useAuthStore();
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};
```

---

## Servicios

### 1. **api.ts** - Cliente HTTP

Cliente Axios configurado con interceptores.

**Configuración:**
```tsx
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor de respuesta para manejar 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
```

**Uso:**
```tsx
import api from '../services/api';

// GET
const response = await api.get('/portfolios/');

// POST
await api.post('/portfolios/', { name: 'Nueva' });

// PATCH
await api.patch(`/portfolios/${id}`, { name: 'Editada' });

// DELETE
await api.delete(`/portfolios/${id}`);
```

---

### 2. **authService.ts** - Autenticación

Funciones de login, logout y validación.

```tsx
import api from './api';

export const login = async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data.user;
};

export const logout = async () => {
    await api.post('/auth/logout');
};

export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};
```

---

### 3. **dashboardService.ts** - Estadísticas

Obtiene datos para el dashboard.

```tsx
export interface DashboardStats {
    total_value: number;
    invested_value: number;
    profit_loss: number;
    profit_loss_percent: number;
    positions: Position[];
    distribution: DistributionItem[];
    history: HistoryPoint[];
    top_gainers: Position[];
    top_losers: Position[];
}

export const getDashboardStats = async (
    portfolioId: string
): Promise<DashboardStats> => {
    const response = await api.get(`/dashboard/${portfolioId}/stats`);
    return response.data;
};
```

---

### 4. **fiscalService.ts** - Informes Fiscales

```tsx
export const getFiscalReport = async (
    portfolioId: string,
    year: number
) => {
    const response = await api.get('/fiscal/calculate', {
        params: { portfolio_id: portfolioId, year }
    });
    return response.data;
};
```

---

## Autenticación

### Flujo de Autenticación

```
1. Usuario abre /login
2. Ingresa credenciales y hace submit
3. POST /api/auth/login con { username, password }
4. Backend valida y crea sesión en Redis
5. Backend retorna cookie con session_id
6. Frontend guarda user en authStore
7. Navigate a /dashboard
8. Cada request incluye cookie automáticamente (withCredentials: true)
9. Backend valida sesión en cada request
```

### Auth Store (Zustand)

```tsx
import { create } from 'zustand';

interface User {
    id: string;
    username: string;
    email: string;
    is_admin: boolean;
    base_currency: string;
}

interface AuthState {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    logout: () => set({ user: null })
}));
```

**Uso:**
```tsx
import { useAuthStore } from '../stores/authStore';

const Dashboard = () => {
    const { user } = useAuthStore();
    
    return <h1>Bienvenido, {user?.username}!</h1>;
};
```

---

## Estado Global

### Stores (Zustand)

**1. authStore** - Estado de autenticación
```tsx
{
    user: User | null,
    setUser: (user) => void,
    logout: () => void
}
```

**2. portfolioStore** - Cartera seleccionada
```tsx
{
    selectedPortfolioId: string | null,
    setSelectedPortfolio: (id: string) => void
}
```

**Ventajas de Zustand:**
- Ligero (1KB)
- Sin boilerplate
- TypeScript nativo
- Hooks simples

---

## Estilos y UI

### Tailwind CSS

**Configuración** (`tailwind.config.js`):
```js
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'dark-bg': '#0f172a',
                'dark-card': '#1e293b',
                'dark-border': '#334155',
                'dark-muted': '#94a3b8',
            }
        }
    }
}
```

**Clases comunes:**
```tsx
// Contenedores
<div className="bg-dark-card rounded-lg p-6 shadow-lg">

// Botones
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">

// Tarjetas
<div className="border border-dark-border rounded-lg p-4">

// Texto
<h1 className="text-2xl font-bold text-white">
<p className="text-dark-muted">
```

### Tema Oscuro

Toda la aplicación usa tema oscuro por defecto:
- Background: `#0f172a`
- Cards: `#1e293b`
- Borders: `#334155`
- Text: `#ffffff` / `#94a3b8`

---

## Configuración

### Variables de Entorno (`.env`)

```bash
# API URL (opcional, si vacío usa auto-detección)
VITE_API_URL=http://192.168.0.8:8000/api

# Opcional: API keys para servicios externos
VITE_ANALYTICS_ID=
```

**Auto-detección de API URL:**
```tsx
// Si VITE_API_URL no está definido:
const apiUrl = `http://${window.location.hostname}:8000/api`;
```

---

### Vite Config (`vite.config.ts`)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 3000,
        watch: {
            usePolling: true
        }
    },
    preview: {
        host: '0.0.0.0',
        port: 3000
    }
})
```

---

### TypeScript Config (`tsconfig.json`)

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Ejecución

### Desarrollo

```bash
# Con Docker Compose
docker compose up frontend

# Sin Docker
cd frontend
npm install
npm run dev
# Abre http://localhost:3000
```

### Producción

```bash
# Build
npm run build
# Genera dist/

# Preview
npm run preview

# Deploy (servir dist/ con nginx/apache)
```

---

## Estructura de Componente Típico

```tsx
/**
 * Ejemplo: Página de Dashboard
 */
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { getDashboardStats, DashboardStats } from '../services/dashboardService';
import { useAuthStore } from '../stores/authStore';

export default function Dashboard() {
    // Estado local
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Estado global
    const { user } = useAuthStore();
    
    // Effects
    useEffect(() => {
        loadStats();
    }, []);
    
    // Handlers
    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await getDashboardStats(portfolioId);
            setStats(data);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };
    
    // Render
    if (loading) return <Layout><div>Cargando...</div></Layout>;
    
    return (
        <Layout>
            <div className="container mx-auto p-6">
                <h1 className="text-2xl font-bold text-white mb-6">
                    Dashboard
                </h1>
                
                {/* Contenido */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Métricas */}
                </div>
            </div>
        </Layout>
    );
}
```

---

## Formateo de Datos

### Utils (`formatters.ts`)

```tsx
/**
 * Formatea número como moneda
 */
export const formatCurrency = (
    value: number,
    currency: string = 'EUR'
): string => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency
    }).format(value);
};

/**
 * Formatea porcentaje
 */
export const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

/**
 * Obtiene símbolo de moneda
 */
export const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
        'EUR': '€',
        'USD': '$',
        'GBP': '£',
        'BRL': 'R$',
        'JPY': '¥'
    };
    return symbols[currency] || currency;
};

/**
 * Formatea fecha
 */
export const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('es-ES');
};
```

**Uso:**
```tsx
import { formatCurrency, formatPercent } from '../utils/formatters';

<p>{formatCurrency(17500.50, 'EUR')}</p>
// Resultado: "17.500,50 €"

<p>{formatPercent(15.67)}</p>
// Resultado: "+15.67%"
```

---

## Testing (Futuro)

```bash
# Instalar vitest
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Ejecutar tests
npm run test

# Con coverage
npm run test:coverage
```

---

## Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Dependencias
COPY package*.json ./
RUN npm ci

# Código
COPY . .

# Puerto
EXPOSE 3000

# Comando
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

---

## Convenciones de Código

### Nombres
- Componentes: PascalCase (`Dashboard.tsx`)
- Hooks: camelCase con prefijo `use` (`useAuthStore`)
- Constantes: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Funciones: camelCase (`loadStats`)

### Imports
```tsx
// 1. React y librerías
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// 2. Componentes
import Layout from '../components/Layout';

// 3. Servicios y stores
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

// 4. Tipos
import type { DashboardStats } from '../services/dashboardService';
```

---

## Troubleshooting

### Error: CORS
**Problema**: Error de CORS al hacer peticiones

**Solución**:
1. Verificar que backend está en modo development (`ENVIRONMENT=development`)
2. Verificar que `withCredentials: true` está en axios
3. Verificar que IP del frontend está en rango permitido (192.168.x.x)

### Error: 401 Unauthorized
**Problema**: Usuario no autenticado

**Solución**:
1. Verificar que cookie `session_id` existe en DevTools > Application > Cookies
2. Verificar que sesión en Redis no expiró
3. Hacer logout y volver a hacer login

### Error: API no responde
**Problema**: Backend no responde o timeout

**Solución**:
1. Verificar que backend está corriendo: `docker compose ps backend`
2. Verificar logs: `docker compose logs backend`
3. Verificar que puerto 8000 está expuesto

---

**Última actualización**: Diciembre 2024  
**Mantenedor**: Sistema BolsaV6
