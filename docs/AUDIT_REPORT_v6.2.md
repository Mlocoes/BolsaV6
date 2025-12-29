# Reporte de Auditoría del Sistema - BolsaV6 (v6.2)

## 1. Seguridad e Integridad

### 🛡️ Secretos Expuestos (Crítico)
- **Hallazgo**: Se detectaron múltiples claves de API reales en archivos `.env` y scripts.
  - `POLYGON_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `FINNHUB_API_KEY`.
- **Riesgo**: Si estos archivos se suben a un repositorio público, terceros podrían consumir créditos de las APIs.
- **Recomendación**: Usar variables de entorno inyectadas o archivos `.env` locales protegidos por `.gitignore`. Eliminar las claves actuales y regenerarlas.

### 🔐 Contraseñas en Texto Plano (Moderado)
- **Hallazgo**: El archivo `alembic.ini` y `scripts/.env` contienen contraseñas de base de datos en texto plano.
- **Riesgo**: Acceso no autorizado a la base de datos si el entorno es comprometido.
- **Recomendación**: Usar interpolación de variables de entorno para la URL de la base de datos en Alembic.

## 2. Dependencias y Vulnerabilidades

### 📦 Frontend (Moderado)
- **Vulnerabilidad**: `esbuild` <= 0.24.2 (Moderate - Cross-site Scripting / Dev Server).
- **Acción**: Actualizar `vite` a la versión 7 o aplicar `npm audit fix --force`.

## 3. Optimización y Rendimiento

### 🚀 N+1 Queries en Base de Datos (Alto)
- **Hallazgo 1**: En `api/portfolios.py` (`get_portfolio_positions`), se consulta la última cotización un activo a la vez dentro de un bucle.
- **Hallazgo 2**: En `dashboard_service.py`, la conversión de moneda (`forex_service`) realiza consultas individuales por cada día del historial y por cada activo.
- **Impacto**: Latencia significativa al cargar dashboards con muchos activos o años de historial.
- **Recomendación**: Implementar carga masiva (Eager Loading) de cotizaciones y tasas de cambio antes de iniciar los bucles de cálculo.

## 4. Calidad de Código y Duplicación

### 🧩 Duplicación de Lógica (Bajo)
- **Hallazgo**: La función `get_historical_quotes` está implementada de forma casi idéntica en 3 servicios distintos (Polygon, yFinance, AlphaVantage).
- **Hallazgo**: La utilidad `clean_decimal` se encuentra duplicada en varios puntos del backend.
- **Recomendación**: Crear una clase base `BaseQuoteProvider` y centralizar utilidades matemáticas en `app/core/utils.py`.

---

## Próximos Pasos Sugeridos
1. **Acción Inmediata**: Limpiar secretos y actualizar dependencias.
2. **Refactorización**: Optimizar las consultas N+1 en el Dashboard.
3. **Mantenimiento**: Centralizar proveedores de cotizaciones bajo una interfaz común.
