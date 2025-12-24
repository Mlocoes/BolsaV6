# 💼 BolsaV6 - Sistema de Gestión de Carteras de Inversión

![Version](https://img.shields.io/badge/version-6.0-blue)
![Python](https://img.shields.io/badge/python-3.11+-green)
![React](https://img.shields.io/badge/react-18.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

Sistema profesional y completo para gestión de carteras de inversión con seguimiento de rendimiento, importación de datos, cálculos fiscales y análisis avanzado.

---

## 📋 Índice

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación Rápida](#-instalación-rápida)
- [Uso](#-uso)
- [Documentación](#-documentación)
- [APIs Externas](#-apis-externas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Desarrollo](#-desarrollo)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Características

### Gestión de Carteras
- ✅ **Múltiples carteras** por usuario
- ✅ **Transacciones** (compra, venta, dividendos, splits)
- ✅ **Posiciones actuales** con P/L en tiempo real
- ✅ **Histórico de rendimiento** (30/90/365 días)
- ✅ **Distribución por activo** con gráficos interactivos

### Cotizaciones de Mercado
- ✅ **Integración con Polygon.io** (500-730 días de históricos)
- ✅ **Finnhub** para cotizaciones en tiempo real
- ✅ **Yahoo Finance** para sincronización diaria automática
- ✅ **Importación masiva inteligente** con verificación de cobertura
- ✅ **Soporte multi-activo**: acciones, ETFs, criptomonedas, divisas

### Análisis Fiscal
- ✅ **Cálculo de plusvalías/minusvalías** con método FIFO
- ✅ **Wash Sale Rule** (30 días antes/después)
- ✅ **Informes fiscales detallados** por año
- ✅ **Exportación a PDF** para declaración de impuestos

### Importación de Datos
- ✅ **Importación desde Excel** (transacciones)
- ✅ **Importación masiva de cotizaciones** con estado de cobertura
- ✅ **Plantillas descargables**
- ✅ **Validación automática** de formatos

### Administración
- ✅ **Gestión de usuarios** con roles (admin/usuario)
- ✅ **Catálogo de activos** con búsqueda y filtros
- ✅ **Gestión de mercados** bursátiles
- ✅ **Configuración personalizada** (moneda base, preferencias)

---

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: FastAPI 0.104+ (Python 3.11)
- **ORM**: SQLAlchemy 2.0 con Alembic
- **Base de Datos**: PostgreSQL 15
- **Cache/Sesiones**: Redis 7
- **Testing**: Pytest

### Frontend
- **Framework**: React 18.2 con TypeScript
- **Build Tool**: Vite 5.0
- **UI/Estilos**: Tailwind CSS 3.4
- **Gráficos**: Recharts 2.10
- **Estado**: Zustand 4.4

### Infraestructura
- **Contenedores**: Docker + Docker Compose

### APIs Externas
- **Polygon.io**: Cotizaciones históricas
- **Finnhub**: Cotizaciones tiempo real
- **Yahoo Finance**: Sincronización diaria

---

## 🏗️ Arquitectura

```
┌──────────────┐
│   Frontend   │  React + Vite
│  Port: 3000  │
└──────┬───────┘
       │ HTTP/REST
       ▼
┌──────────────┐
│  Backend API │  FastAPI
│  Port: 8000  │
└──┬───────┬───┘
   │       │
   ▼       ▼
┌────┐  ┌──────┐
│ DB │  │Redis │
└────┘  └──────┘
```

---

## 🚀 Instalación Rápida

### Requisitos Previos
- Docker 20.10+
- Docker Compose 2.0+
- Git

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/Mlocoes/BolsaV6.git
cd BolsaV6
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
nano .env  # Editar con tus valores
```

3. **Levantar servicios**
```bash
docker compose up -d
```

4. **Acceder**
- Frontend: http://localhost:3000
- Backend Docs: http://localhost:8000/docs

5. **Login inicial**
```
Usuario: admin
Contraseña: admin123
```

---

## 📖 Documentación Completa

- **[Base de Datos](./docs/DATABASE_DOCUMENTATION.md)**: Esquema completo, tablas, relaciones
- **[Backend](./docs/BACKEND_DOCUMENTATION.md)**: APIs, servicios, autenticación
- **[Frontend](./docs/FRONTEND_DOCUMENTATION.md)**: Componentes, pantallas, servicios

---

## 🔑 APIs Externas

### Polygon.io (Históricos)
1. Registrarse en https://polygon.io/
2. Copiar API key
3. Agregar a `.env`: `POLYGON_API_KEY=tu-key`

### Finnhub (Tiempo Real)
1. Registrarse en https://finnhub.io/
2. Copiar API key
3. Agregar a `.env`: `FINNHUB_API_KEY=tu-key`

---

## 👨‍💻 Desarrollo

### Migraciones de BD
```bash
docker compose exec backend alembic upgrade head
```

### Ver Logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Testing
```bash
docker compose exec backend pytest
```

---

## 🐛 Troubleshooting

Ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para solución de problemas comunes.

---

## 📄 Licencia

MIT License

---

**Última actualización**: Diciembre 2024  
**Versión**: 6.0
