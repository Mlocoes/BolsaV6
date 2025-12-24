# Importación Masiva de Históricos - Documentación

## 📋 Resumen

Sistema inteligente de importación masiva de cotizaciones históricas que verifica la completitud de datos antes de ejecutar consultas a APIs externas, optimizando el uso de rate limits y evitando importaciones duplicadas.

## 🎯 Funcionalidades Implementadas

### Backend

#### 1. Endpoint de Verificación de Cobertura Individual
**`GET /api/quotes/asset/{asset_id}/coverage`**

Retorna información detallada sobre la cobertura de cotizaciones de un activo específico.

**Respuesta:**
```json
{
  "asset_id": "uuid",
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "needs_import": false,
  "reason": "complete",
  "message": "Completo (450 cotizaciones)",
  "coverage": {
    "has_quotes": true,
    "total_quotes": 450,
    "first_date": "2023-01-15",
    "last_date": "2024-12-20",
    "days_since_last_update": 4,
    "is_complete": true,
    "needs_update": false
  }
}
```

#### 2. Endpoint de Verificación de Cobertura Global
**`GET /api/quotes/assets/coverage`**

Retorna información de cobertura de todos los activos en la base de datos.

**Respuesta:**
```json
{
  "assets": [
    {
      "asset_id": "uuid",
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "needs_import": false,
      "reason": "complete",
      "message": "Completo (450 cotizaciones)",
      "coverage": { ... }
    }
  ],
  "stats": {
    "total_assets": 15,
    "no_data": 3,
    "incomplete": 5,
    "outdated": 2,
    "complete": 5
  }
}
```

#### 3. Endpoint de Importación Masiva
**`POST /api/quotes/import/bulk-historical`**

Ejecuta importación masiva inteligente con verificación previa.

**Parámetros (Body JSON):**
```json
{
  "asset_ids": ["uuid1", "uuid2"],  // Opcional: subset de activos
  "force_refresh": false             // Opcional: forzar reimportación
}
```

**Respuesta (202 Accepted):**
```json
{
  "message": "Importación masiva iniciada para 15 activos",
  "total_assets": 15,
  "force_refresh": false
}
```

**Proceso en Background:**
1. Verifica cobertura de cada activo
2. Salta activos completos (a menos que `force_refresh=true`)
3. Importa usando Polygon.io (prioridad) o yfinance (fallback)
4. Implementa rate limiting (12s entre requests = 5 req/min)
5. Registra logs detallados del proceso

### Frontend

#### Página de Importación (`/import`)

**Nuevo Botón: "Histórico de Cotizaciones"**
- Acción: Abre modal con estado de todos los activos
- Modal muestra tabla interactiva con cobertura

**Modal de Cobertura:**

**Características:**
- Tabla con todas las cotizaciones de activos
- Columnas: Símbolo, Nombre, Cotizaciones, Primera, Última, Días, Estado
- Estados visuales con badges coloreados:
  - 🔴 **Sin datos** (no_data): 0 cotizaciones
  - 🟡 **Incompleto** (incomplete_data): <400 cotizaciones
  - 🟠 **Desactualizado** (outdated): >7 días sin actualizar
  - 🟢 **Completo** (complete): ≥400 cotizaciones y actualizado

**Botones de Acción:**
1. **"Importar Faltantes"**
   - Importa solo activos con `needs_import=true`
   - Muestra contador de activos a importar
   - Deshabilitado si no hay activos faltantes

2. **"Forzar Reimportar Todo"**
   - Reimporta todos los activos sin importar su estado
   - Útil para refrescar datos completos

3. **"🔄 Refrescar"**
   - Recarga la información de cobertura
   - Útil para ver progreso después de importación

## 📊 Lógica de Verificación

### Criterios de Completitud

**Completo (`is_complete = true`):**
- Tiene ≥400 cotizaciones
- Representa aproximadamente 1.5 años de datos de mercado
- Considera días hábiles (~250 días/año)

**Desactualizado (`needs_update = true`):**
- Han pasado >7 días desde última cotización
- Requiere actualización aunque tenga datos completos

**Incompleto:**
- Tiene <400 cotizaciones
- Necesita importación de histórico completo

**Sin datos:**
- 0 cotizaciones en base de datos
- Requiere importación inicial completa

### Razones de Necesidad de Importación

1. **`no_data`**: Sin cotizaciones en BD
2. **`incomplete_data`**: Datos parciales (<400 quotes)
3. **`outdated`**: Desactualizado (>7 días)
4. **`complete`**: Completo y actualizado (no necesita importación)

## 🔄 Flujo de Importación

### 1. Usuario inicia importación masiva

```
Usuario → Click "Histórico de Cotizaciones"
       → Frontend llama GET /quotes/assets/coverage
       → Modal muestra tabla con estados
       → Usuario click "Importar Faltantes"
       → Frontend llama POST /quotes/import/bulk-historical
       → Backend responde 202 Accepted
       → Toast confirma inicio de importación
```

### 2. Proceso en Background

```python
async def _bulk_import_historical(assets, force_refresh):
    for asset in assets:
        # 1. Verificar si necesita importación
        if not force_refresh:
            check = await _check_asset_needs_import(asset_id, db)
            if not check["needs_import"]:
                logger.info("⏩ Saltando {symbol}: {message}")
                continue
        
        # 2. Intentar con Polygon.io (prioridad)
        quotes_data = await polygon_service.get_historical_quotes(symbol)
        
        # 3. Fallback a yfinance si Polygon falla
        if not quotes_data:
            quotes_data = await yfinance_service.get_historical_quotes(symbol)
        
        # 4. Guardar cotizaciones (evitando duplicados)
        for quote_data in quotes_data:
            existing = await db.execute(
                select(Quote).where(
                    and_(Quote.asset_id == asset_id, Quote.date == quote_date)
                )
            )
            if not existing.scalar_one_or_none():
                db.add(new_quote)
        
        await db.commit()
        
        # 5. Rate limiting (12s = 5 req/min)
        await asyncio.sleep(12)
```

## ⚙️ Configuración

### Rate Limiting

**Polygon.io (Plan Free):**
- Límite: 5 requests/minuto
- Implementado: 12 segundos entre requests
- Histórico: Hasta 500-730 días

**yfinance:**
- Sin límites de API
- Usado como fallback
- Histórico: Sin límite (hasta años atrás)

### Prioridad de Servicios

1. **Polygon.io** - Primera opción para históricos
   - Ventajas: Datos oficiales, hasta 500 días
   - Desventajas: Rate limit de 5/min

2. **yfinance** - Fallback automático
   - Ventajas: Sin límites, gratis
   - Desventajas: Menos oficial, puede fallar ocasionalmente

## 🧪 Testing

### Casos de Prueba

#### 1. Verificar Coverage de Activo Individual
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/quotes/asset/{asset_id}/coverage
```

#### 2. Verificar Coverage de Todos los Activos
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/quotes/assets/coverage
```

#### 3. Importar Solo Faltantes
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force_refresh": false}' \
  http://localhost:8000/api/quotes/import/bulk-historical
```

#### 4. Forzar Reimportación Completa
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force_refresh": true}' \
  http://localhost:8000/api/quotes/import/bulk-historical
```

### Verificar Logs del Proceso

```bash
docker compose logs backend -f | grep "bulk_import"
```

**Output esperado:**
```
🚀 Iniciando importación masiva de 15 activos
⏩ Saltando AAPL: Completo (450 cotizaciones)
📥 Importando GOOGL: Datos parciales (150 cotizaciones)
📊 Usando Polygon.io para GOOGL
✅ GOOGL: 350 cotizaciones nuevas guardadas
⏱️ Esperando 12s (rate limit)...
═══════════════════════════════════════
📊 IMPORTACIÓN MASIVA COMPLETADA
═══════════════════════════════════════
Total procesados: 15
Importados: 8
Saltados: 7
Errores: 0
═══════════════════════════════════════
```

## 📈 Métricas y Estadísticas

### Estadísticas en Modal

El modal muestra un resumen en el header:
```
15 activos • 3 sin datos • 5 incompletos • 7 completos
```

### Estadísticas en Response

```json
{
  "stats": {
    "total_assets": 15,
    "no_data": 3,        // Necesitan importación completa
    "incomplete": 5,     // Necesitan más datos
    "outdated": 2,       // Necesitan actualización
    "complete": 5        // No necesitan importación
  }
}
```

## 🔒 Seguridad y Validaciones

### Autenticación
- Todos los endpoints requieren `Authorization: Bearer TOKEN`
- Token obtenido del endpoint `/api/auth/login`

### Validaciones

1. **Verificación de activos existentes:**
   ```python
   asset = await db.execute(select(Asset).where(Asset.id == asset_id))
   if not asset.scalar_one_or_none():
       raise HTTPException(404, "Activo no encontrado")
   ```

2. **Prevención de duplicados:**
   - Constraint único en BD: `uq_quote_asset_date`
   - Verificación en código antes de insertar
   - Normalización de fechas a medianoche UTC

3. **Manejo de errores:**
   - Rollback automático en caso de error
   - Logs detallados de cada error
   - Continuación del proceso en otros activos

## 🚀 Mejoras Futuras

### Posibles Optimizaciones

1. **WebSockets para progreso en tiempo real:**
   - Notificar al frontend del progreso de importación
   - Mostrar barra de progreso actualizada en vivo

2. **Cola de trabajos con límite de concurrencia:**
   - Usar Celery o similar para gestionar cola
   - Procesar múltiples activos en paralelo (respetando rate limits)

3. **Campo `last_quote_import_at` en modelo Asset:**
   - Trackear última importación sin queries adicionales
   - Requiere migración de BD

4. **Cache de coverage:**
   - Redis para cachear información de cobertura
   - TTL de 5 minutos para reducir queries

5. **Notificaciones por email:**
   - Enviar resumen al completar importación masiva
   - Especialmente útil para procesos largos (>100 activos)

## 📝 Notas de Implementación

### Decisiones de Diseño

1. **Ejecución en Background:**
   - La importación se ejecuta con `BackgroundTasks`
   - Response inmediato (202 Accepted)
   - Logs para seguimiento del progreso

2. **Rate Limiting Conservador:**
   - 12 segundos entre requests
   - Previene bloqueo de APIs externas
   - Para 100 activos: ~20 minutos

3. **Criterio de 400 cotizaciones:**
   - Basado en ~250 días hábiles/año
   - 400 cotizaciones ≈ 1.6 años de mercado
   - Balance entre completitud y practicidad

4. **Fallback a yfinance:**
   - Garantiza éxito incluso si Polygon falla
   - yfinance no tiene límites de API
   - Datos igualmente confiables

## 🔗 Archivos Modificados

- `backend/app/api/quotes.py` (+487 líneas)
  - Funciones: `_get_asset_quote_coverage()`, `_check_asset_needs_import()`, `_bulk_import_historical()`
  - Endpoints: `/asset/{id}/coverage`, `/assets/coverage`, `/import/bulk-historical`

- `frontend/src/pages/Import.tsx` (+100 líneas)
  - Función: `handleImportHistorical()`, `handleStartBulkImport()`
  - Componente: Modal de cobertura con tabla interactiva

## ✅ Checklist de Implementación

- [x] Helpers de verificación de cobertura en backend
- [x] Endpoint GET /quotes/assets/coverage
- [x] Endpoint GET /quotes/asset/{id}/coverage
- [x] Endpoint POST /quotes/import/bulk-historical
- [x] Lógica de verificación inteligente
- [x] Rate limiting implementado
- [x] Fallback a yfinance
- [x] Frontend: Modal de cobertura
- [x] Frontend: Tabla con estados visuales
- [x] Frontend: Botones de importación
- [x] Testing manual de endpoints
- [x] Commit y documentación

---

**Fecha de implementación:** 24 de diciembre de 2025  
**Commit:** 9cc0c8e  
**Estado:** ✅ Completado y funcional
