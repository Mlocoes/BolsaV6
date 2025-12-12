# ⚙️ Alpha Vantage API - Límites y Uso

## 📋 Resumen

Documentación oficial sobre los límites de la API de Alpha Vantage y su uso en BolsaV6.

---

## 🎯 Límites de la API

### Plan Gratuito - Documentación Oficial

Según la [documentación oficial de Alpha Vantage](https://www.alphavantage.co/support/):

> **"We are pleased to provide free stock API service covering the majority of our datasets for up to 25 requests per day."**

**Límites confirmados:**
- **25 llamadas API por DÍA** (no por minuto, no por sesión)
- 100 días de histórico por llamada (modo `compact`)
- 20+ años de histórico con `outputsize=full` (solo premium)

### Importante

❌ **INCORRECTO**: Limitar a 5 activos por importación  
✅ **CORRECTO**: Respetar límite de 25 llamadas/día

El límite es **diario**, no por sesión. Cada usuario puede hacer hasta 25 llamadas en un día natural.

---

## ✅ Implementación Actual

### Descarga Sin Límite Artificial

Durante la importación automática:
1. **Todos los activos nuevos**: Se intenta descargar cotizaciones históricas
2. **Límite natural**: La API rechazará automáticamente después de 25 llamadas
3. **Manejo de errores**: Los fallos no interrumpen la importación
4. **Mensajes informativos**: Logs claros sobre éxitos y fallos

### Código Implementado

**Archivo**: `backend/app/api/import_transactions.py`

```python
# Contador de activos creados
assets_created = 0

# En el loop de procesamiento de activos
if not existing_asset:
    # Crear nuevo activo
    new_asset = Asset(...)
    session.add(new_asset)
    assets_created += 1
    
    # Intentar descargar cotizaciones para todos los activos nuevos
    # El límite de 25 llamadas/día lo controla la API, no nosotros
    print(f"📥 Intentando descargar cotizaciones para {symbol}...")
    try:
        historical_quotes = await alpha_vantage_service.get_historical_quotes(
            symbol=symbol
        )
        
        if historical_quotes:
            # Insertar cotizaciones en BD
            for quote_data in historical_quotes:
                quote = Quote(...)
                session.add(quote)
                quotes_imported += 1
            
            print(f"✅ {len(historical_quotes)} cotizaciones importadas para {symbol}")
        else:
            print(f"⚠️ No se pudieron obtener cotizaciones para {symbol}")
    
    except Exception as e:
        print(f"❌ Error al descargar cotizaciones para {symbol}: {e}")
        # No interrumpir la importación si falla la descarga de quotes
```

### Manejo de Errores en el Servicio

**Archivo**: `backend/app/services/alpha_vantage_service.py`

```python
try:
    df, meta_data = self.ts.get_daily(
        symbol=symbol.upper(),
        outputsize='compact'  # Últimos 100 días
    )
except Exception as api_error:
    error_msg = str(api_error).lower()
    
    # Error: Límite de API alcanzado (25 llamadas/día)
    if 'api call frequency' in error_msg or 'limit' in error_msg:
        logger.warning(f"⚠️ Límite diario de API alcanzado para {symbol}")
        return None
    
    # Error: Símbolo no encontrado
    elif 'invalid api call' in error_msg or 'not found' in error_msg:
        logger.warning(f"⚠️ Símbolo {symbol} no encontrado en Alpha Vantage")
        return None
    
    # Otro error: propagar
    else:
        raise api_error
```

---

## 📊 Uso del Límite Diario

### Ejemplo Práctico

```
📥 Importación con 20 activos nuevos:
- El sistema intenta descargar cotizaciones para todos
- Alpha Vantage responde a las primeras 20 llamadas
- Las llamadas 21-25 están disponibles para otros usos
- Llamadas 26+ son rechazadas automáticamente por la API
- ✅ 20 activos creados con cotizaciones históricas
```

### Distribución del Límite

| Operación | Llamadas | % del límite |
|-----------|----------|--------------|
| Importación inicial (20 activos) | 20 | 80% |
| Actualizaciones manuales | 5 | 20% |
| **Total disponible** | **25** | **100%** |

**Recomendación**: Si importa más de 25 activos en un día:
- Los primeros 25 obtendrán cotizaciones
- Los restantes se crearán sin cotizaciones
- Puede importarlos al día siguiente

---

## 🎯 Estrategias de Uso

### Opción 1: Importación Gradual

**Si tiene más de 25 activos nuevos**:

```
Día 1: Importar 5 activos nuevos → Todos con cotizaciones
Día 2: Importar 5 activos nuevos → Todos con cotizaciones
Día 3: Importar 5 activos nuevos → Todos con cotizaciones
```

```
Día 1: Importar activos 1-25 del Excel → obtienen cotizaciones
Día 2: Importar activos 26-50 del Excel → obtienen cotizaciones
Día 3: Importar activos 51-75 del Excel → obtienen cotizaciones
```

### Opción 2: Script Manual de Descarga

**Para activos sin cotizaciones**

Ejecutar el script [backend/download_quotes.py](../backend/download_quotes.py):

```bash
docker compose exec backend python download_quotes.py
```

Este script:
- Encuentra activos sin cotizaciones
- Descarga las primeras 5 (o las que permita el límite)
- Ejecutarlo diariamente hasta completar todos

### Opción 3: Upgrade a Plan Premium

**Para uso profesional intensivo**

```
Plan Premium Alpha Vantage:
- 75+ llamadas/minuto
- Miles de llamadas/día
- Histórico completo (20+ años)
- Datos en tiempo real

Desde: $49.99/mes
Web: https://www.alphavantage.co/premium/
```

---

## 🔧 Configuración

### Variables de Entorno

**Archivo**: `.env`

```bash
# API Key (registrar en https://www.alphavantage.co/support/)
ALPHA_VANTAGE_API_KEY=TU_API_KEY_AQUI

# Límite diario (solo informativo, no se usa para bloquear)
ALPHA_VANTAGE_RATE_LIMIT=25
```

**Nota**: `ALPHA_VANTAGE_RATE_LIMIT` es solo para documentación. El límite real lo impone la API de Alpha Vantage.

---

## 📝 Mensajes de Log

### Logs Esperados

```bash
# Caso 1: Activo dentro del límite (1-5)
📥 Intentando descargar cotizaciones para TSLA...
✅ 100 cotizaciones importadas para TSLA

# Caso 2: Activo fuera del límite (6+)
ℹ️ Límite de API: cotizaciones para NVDA no descargadas
💡 Puedes actualizar manualmente después

# Caso 3: Error de API (límite alcanzado)
⚠️ Límite de API alcanzado para AAPL

# Caso 4: Símbolo no encontrado
⚠️ Símbolo UNKNOWN no encontrado en Alpha Vantage
```

---

## 🚀 Próximos Pasos

### Mejoras Futuras

1. **Rate Limiting Dinámico**
   ```python
   # Detectar plan del usuario (demo/free/premium)
   # Ajustar límite automáticamente
   limit = get_api_limit_for_plan(user.alpha_vantage_plan)
   ```

2. **Cola de Cotizaciones Pendientes**
   ```python
   # Guardar lista de activos sin cotizaciones
   # Procesar automáticamente en background
   # Distribuir llamadas a lo largo del día
   ```

3. **Dashboard de Uso de API**
   ```python
   # Mostrar en UI:
   # - Llamadas usadas hoy
   # - Llamadas restantes
   # - Activos pendientes de cotizaciones
   ```

4. **Notificaciones**
   ```python
   # Alertar usuario cuando:
   # - Límite de API próximo a agotarse
   # - Activos creados sin cotizaciones
   # - Cotizaciones pendientes completadas
   ```

---

## ✅ Testing

### Casos de Prueba

**Test 1: Importar 3 activos nuevos**
```
Esperado:
- 3 activos creados
- 3 activos con cotizaciones (100 días cada uno)
- 3 llamadas API usadas
- 22 llamadas restantes
```

**Test 2: Importar 7 activos nuevos**
```
Esperado:
- 7 activos creados
- 5 activos con cotizaciones
- 2 activos sin cotizaciones (mensajes informativos)
- 5 llamadas API usadas
- 20 llamadas restantes
```

**Test 3: Importar 10 activos (5 existen, 5 nuevos)**
```
Esperado:
- 5 activos creados (solo los nuevos)
- 5 activos con cotizaciones
- 0 activos sin cotizaciones (justo en el límite)
- 5 llamadas API usadas
```

---

## 📚 Referencias

- [Alpha Vantage API Limits](https://www.alphavantage.co/support/#api-key)
- [Alpha Vantage Pricing Plans](https://www.alphavantage.co/premium/)
- Documentación relacionada: `docs/IMPORTACION_AUTOMATICA.md`
- Código fuente:
  - `backend/app/api/import_transactions.py`
  - `backend/app/services/alpha_vantage_service.py`
