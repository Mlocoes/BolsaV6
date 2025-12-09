# BolsaV6 - Sistema de Gestión de Carteras de Inversión

Sistema profesional, seguro y escalable para gestión de carteras de inversión con arquitectura moderna.

## 🚀 Características

### Backend (Python/FastAPI)
- **API RESTful asíncrona** con FastAPI
- **PostgreSQL** con SQLAlchemy async
- **Redis** para sesiones efímeras (se pierden al reload)
- **Alpha Vantage API** para cotizaciones
- **Seguridad robusta**: Bcrypt, rate limiting, CORS
- **Docker** containerizado

### Frontend (React/TypeScript)
- **React 18 + TypeScript** con Vite
- **AG Grid** para tablas tipo Excel
- **Tema oscuro profesional** con Tailwind CSS
- **Responsive** (desktop + móvil)
- **Recharts** para gráficos

### Base de Datos
- **6 Tablas**: Users, Assets, Quotes, Portfolios, Transactions, Results
- **Snapshots diarios** de posiciones
- **Índices optimizados** para consultas rápidas

## 📋 Prerrequisitos

- Docker y Docker Compose
- Git

## ⚡ Inicio Rápido

```bash
# Clonar repositorio
git clone <repo-url>
cd BolsaV6

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
nano .env

# Levantar servicios
docker-compose up -d

# Crear tablas (primera vez)
docker-compose exec backend alembic upgrade head

# Crear usuario admin (primera vez)
docker-compose exec backend python -m app.scripts.create_admin
```

### Accesos
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

## 📂 Estructura

```
BolsaV6/
├── backend/              # FastAPI Backend
│   ├── app/
│   │   ├── api/          # Endpoints
│   │   ├── core/         # Config, DB, Security
│   │   ├── models/       # SQLAlchemy Models
│   │   ├── schemas/      # Pydantic Schemas
│   │   ├── services/     # Business Logic
│   │   └── main.py
│   ├── alembic/          # DB Migrations
│   └── Dockerfile
├── frontend/             # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── stores/
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## 🔒 Seguridad

- **Sesiones efímeras**: Se pierden al recargar página (login requerido)
- **Contraseñas hasheadas**: Bcrypt
- **Variables de entorno**: Nunca hardcodeadas
- **CORS configurado**
- **Rate limiting** en endpoints críticos

## 📄 Licencia

MIT
