# 📥 Importación Automática de Activos y Cotizaciones

## Descripción General

El sistema de importación de Excel ha sido mejorado para **auto-registrar activos nuevos** y **descargar sus cotizaciones históricas** automáticamente cuando no existen en la base de datos.

---

## ✨ Funcionalidades

### 1. Auto-Registro de Activos

Cuando el sistema detecta un activo que no existe en la base de datos durante la importación:

```
📄 Excel → 🔍 Buscar TSLA → ❌ No existe → ✅ Crear automáticamente
```

**Datos extraídos:**
- **Símbolo**: Del campo "Valor" (ej: TSLA, AAPL, NVDA)
- **Nombre**: Primera línea del campo "Valor"
- **Tipo**: STOCK (por defecto)
- **Moneda**: USD (por defecto)
- **Mercado**: Unknown (hasta actualizarse)

### 2. Importación de Cotizaciones Históricas

Inmediatamente después de crear un activo nuevo, el sistema:

1. **Conecta a Yahoo Finance** (API gratuita)
2. **Descarga histórico reciente** (si está habilitado)
3. **Guarda cotizaciones OHLCV** en la tabla `quotes`:
   - Open (apertura)
   - High (máximo)
   - Low (mínimo)
   - Close (cierre)
   - Volume (volumen)
4. **Continúa la importación** sin interrupciones

**Fuente de datos**: Yahoo Finance (yfinance)  
**Período**: Configurable (generalmente histórico completo disponible)  
**Frecuencia**: Diaria (1d)

---

## 🔄 Flujo de Importación

### Antes (manual)
```
1. Usuario sube Excel
2. ❌ Error: Activo TSLA no existe
3. Usuario debe ir a "Activos"
4. Usuario registra TSLA manualmente
5. Usuario vuelve a importar Excel
6. ✅ Importación exitosa
```

### Ahora (automático)
```
1. Usuario sube Excel
2. 🔍 Sistema detecta TSLA no existe
3. ✅ Crea TSLA automáticamente
4. 📥 Descarga últimos 100 días de cotizaciones
5. ✅ Continúa importando transacciones
6. ✅ Todo completado en un solo paso
```

---

## 📊 Ejemplo de Respuesta

```json
{
  "success": true,
  "transactions_created": 45,
  "buy_sell_count": 40,
  "corporate_transactions": 5,
  "transactions_skipped": 0,
  "assets_created": 3,
  "quotes_imported": 2190,
  "errors": null,
  "message": "✅ Importación completada: 40 transacciones de compra/venta, 5 operaciones corporativas (splits, dividendos, etc.), 3 activos nuevos registrados, 2190 cotizaciones históricas importadas"
}
```

### Desglose:
- **45 transacciones** importadas en total
- **40 compras/ventas** + **5 corporativas** (dividendos, splits)
- **3 activos nuevos** creados (TSLA, NVDA, AMD)
- **2190 cotizaciones** históricas (3 activos × 730 días ≈ 2190)

---

## 🎯 Casos de Uso

### Caso 1: Primera Importación
**Escenario:** Usuario nuevo importando su primer Excel

```
Excel contiene:
- 10 activos diferentes
- 100 transacciones

Resultado:
✅ 10 activos creados automáticamente
✅ ~1,000 cotizaciones históricas importadas (10 × 100 días)
✅ 100 transacciones registradas
⏱️ Tiempo: ~20 segundos
```

### Caso 2: Importación con Activos Existentes
**Escenario:** Usuario importando más transacciones

```
Excel contiene:
- 8 activos (5 ya existen, 3 nuevos)
- 50 transacciones

Resultado:
✅ 3 activos creados (solo los nuevos)
✅ ~300 cotizaciones históricas (solo para los 3 nuevos, 100 días cada uno)
✅ 50 transacciones registradas
⏱️ Tiempo: ~10 segundos
```

### Caso 3: Error al Obtener Cotizaciones
**Escenario:** Yahoo Finance no tiene datos para un símbolo

```
Excel contiene:
- UNKNOWN_TICKER (símbolo inválido)

Resultado:
✅ Activo UNKNOWN_TICKER creado de todos modos
⚠️ No se obtuvieron cotizaciones (símbolo no encontrado en Alpha Vantage)
✅ Transacciones importadas normalmente
⚠️ Usuario puede actualizar cotizaciones manualmente después
```

---

## ⚙️ Configuración

### Período de Histórico

### Configuración de Fuente de Datos

El sistema prioriza **Yahoo Finance** por su disponibilidad de datos gratuitos y amplia cobertura. 

Para configurar o cambiar el comportamiento, revisar `backend/app/config.py` y `backend/app/services/yfinance_service.py`.

2. **Actualizar API Key**:
   - Obtener API key premium de [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
   - Actualizar en `.env`: `ALPHA_VANTAGE_API_KEY=tu_api_key_premium`

### Frecuencia de Datos

Por defecto: **Diario** (Daily)

Alpha Vantage también ofrece:
- Intradiario (1min, 5min, 15min, 30min, 60min)
- Semanal (Weekly)
- Mensual (Monthly)

---

## 🔍 Logs y Diagnóstico

### Verificar importación de cotizaciones

```bash
# Ver logs del backend durante la importación
docker compose logs backend -f

# Buscar mensajes específicos
docker compose logs backend | grep "cotizaciones históricas"
```

**Mensajes esperados:**
```
✅ 100 cotizaciones históricas importadas para TSLA
✅ 100 cotizaciones históricas importadas para NVDA
⚠️ No se pudieron obtener cotizaciones históricas para UNKNOWN
```

### Verificar cotizaciones en BD

```sql
-- Contar cotizaciones por activo
SELECT 
    a.symbol,
    a.name,
    COUNT(q.id) as quotes_count,
    MIN(q.date) as oldest_quote,
    MAX(q.date) as newest_quote
FROM assets a
LEFT JOIN quotes q ON q.asset_id = a.id
GROUP BY a.id, a.symbol, a.name
ORDER BY a.symbol;
```

---

## ⚠️ Limitaciones y Consideraciones

### 1. Disponibilidad de Datos
- **Alpha Vantage** tiene excelente cobertura de acciones US
- Plan gratuito: solo últimos 100 días
- Plan premium: hasta 20+ años de histórico
- Mejor cobertura en mercados principales (NYSE, NASDAQ)

### 2. Rendimiento y Rate Limiting
- La descarga de cotizaciones añade **~3-5 segundos** por activo nuevo
- **⚠️ Rate Limiting Dinámico**: El sistema intentará descargar cotizaciones para todos los nuevos activos.
- Si Alpha Vantage devuelve un error de límite excedido, el sistema **dejará de intentar descargar cotizaciones** para el resto de la importación.
- Los activos restantes se crearán correctamente pero SIN cotizaciones históricas.
- Proceso asíncrono: no bloquea otras operaciones
- **Plan gratuito**: límite de 25 llamadas/día.
- **Plan Premium**: sin límite práctico (dependiendo del plan).

**Ejemplo si se alcanza el límite:**
```
✅ Activos 1-25 (aprox): Creados + 100 días de cotizaciones descargadas
⛔ Límite de API alcanzado
ℹ️ Activos restantes: Creados + Mensaje "Cotizaciones omitidas (límite de API alcanzado previamente)"
💡 Puedes actualizar manualmente las cotizaciones al día siguiente o con un plan premium.
```

### 3. Símbolos Internacionales
- Alpha Vantage usa símbolos directos para US: `TSLA`, `AAPL`
- Mercados internacionales usan sufijos:
  - España: No soportado en plan gratuito
  - UK: Limitado
  - Alemania: Limitado
- Mejor cobertura: Acciones estadounidenses (NYSE, NASDAQ)

### 4. Gestión de Errores
- Si falla la descarga de cotizaciones:
  - ✅ El activo se crea de todos modos
  - ✅ Las transacciones se importan normalmente
  - ⚠️ Las cotizaciones quedan vacías (actualizable después)

---

## 🛠️ Solución de Problemas

### Problema: "No se pudieron obtener cotizaciones"

**Causa:** Alpha Vantage no reconoce el símbolo o límite de API alcanzado

**Solución:**
1. Verificar el símbolo en [Alpha Vantage Symbol Search](https://www.alphavantage.co/documentation/#symbolsearch)
2. Editar el activo en el sistema con el símbolo correcto
3. Esperar si alcanzaste el límite de 25 llamadas/día (plan gratuito)
4. Considerar plan premium para más llamadas
5. O importar cotizaciones manualmente

### Problema: "Importación muy lenta"

**Causa:** Muchos activos nuevos descargando cotizaciones

**Solución:**
1. Normal: 5-10 segundos por activo nuevo
2. Si es crítico, importar en lotes más pequeños
3. O desactivar temporalmente la descarga automática

### Problema: "Cotizaciones con símbolos incorrectos"

**Causa:** Extracción automática de símbolo no perfecta

**Solución:**
1. Revisar el campo "Valor" en el Excel
2. Asegurar formato: `NOMBRE\nSÍMBOLO`
3. O editar manualmente el símbolo después de importar

---

## 📈 Mejoras Futuras

- [ ] Configuración de período por usuario (requiere plan premium)
- [ ] Actualización incremental de cotizaciones
- [ ] Detección automática de mercado (US, EU, etc.)
- [ ] Fallback a múltiples fuentes de datos (Alpha Vantage → yfinance)
- [ ] Progreso en tiempo real de la importación
- [ ] Validación de símbolo antes de importar
- [ ] Caché de cotizaciones para evitar llamadas duplicadas

---

## 📞 Soporte

Si encuentras problemas con la importación automática:
1. Verificar logs: `docker compose logs backend -f`
2. Revisar formato del Excel
3. Consultar [docs/IMPORTACION.md](./IMPORTACION.md) (si existe)

---

**Última actualización:** 11 de diciembre de 2025  
**Versión:** 1.0
