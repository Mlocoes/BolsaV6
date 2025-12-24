# Implementación de Polygon.io en BolsaV6

## 📅 Fecha: 24 de diciembre de 2025

## 🎯 Objetivo

Reemplazar Alpha Vantage con Polygon.io para obtener datos históricos, manteniendo Finnhub para cotizaciones en tiempo real.

## ✅ Cambios Implementados

### 1. Nuevo Servicio: `polygon_service.py`

**Ubicación:** `backend/app/services/polygon_service.py`

**Características:**
- ✅ Obtiene hasta **500-730 días** de histórico (vs 100 de Alpha Vantage)
- ✅ Sin límite diario de requests (vs 25 de Alpha Vantage)
- ✅ Rate limiting: 5 requests/minuto (12s entre requests)
- ✅ Soporte completo para:
  - Acciones (AAPL, TSLA, MSFT, etc.)
  - Crypto (BTC-USD, ETH-USD)
  - Forex (EURUSD=X)
  - Índices vía ETFs (^GSPC → SPY)

**Conversiones automáticas:**
```python
^GSPC → SPY      # S&P 500 vía ETF
^DJI → DIA       # Dow Jones vía ETF
^IXIC → QQQ      # Nasdaq vía ETF
BTC-USD → X:BTCUSD   # Crypto
EURUSD=X → C:EURUSD  # Forex
```

### 2. Configuración Actualizada

**`.env`:**
```bash
# Polygon.io API Key
POLYGON_API_KEY=eoIVHT9YPoIdOeuvMD7fzmhfOx5Ou0B_
```

**`config.py`:**
```python
# Polygon.io (Reemplazo de Alpha Vantage para históricos)
POLYGON_API_KEY: str
```

### 3. Integración en API

**`api/quotes.py` - Función `_fetch_and_save_quotes`:**

**ANTES:**
```python
if full_history:
    # Usar Alpha Vantage (últimos 100 días)
    quotes_data = await alpha_vantage_service.get_historical_quotes(symbol)
```

**DESPUÉS:**
```python
if full_history:
    # Usar Polygon.io (hasta 500 días)
    from app.services.polygon_service import polygon_service
    quotes_data = await polygon_service.get_historical_quotes(symbol)
```

### 4. Dependencias

**`requirements.txt`:**
```
requests==2.31.0  # Agregado para Polygon.io
```

## 🆚 Comparación: Alpha Vantage vs Polygon.io

| Característica | Alpha Vantage | **Polygon.io** |
|----------------|---------------|----------------|
| **Límite diario** | 25 requests ❌ | Ilimitado ✅ |
| **Histórico stocks** | 100 días | **500 días** ✅ |
| **Histórico crypto** | ERROR ❌ | **730 días** ✅ |
| **Rate limit** | 5/min | 5/min |
| **Crypto (BTC/ETH)** | Errores ❌ | Funciona ✅ |
| **Índices** | NO ❌ | Sí (vía ETFs) ✅ |
| **Forex** | ✅ | ✅ |
| **Futuros** | Parcial | ❌ (requiere plan pago) |

## 🏗️ Arquitectura Híbrida

```
┌─────────────────────────────────────────┐
│         BolsaV6 Backend                 │
├─────────────────────────────────────────┤
│                                         │
│  📊 Datos Históricos:                   │
│  └─→ Polygon.io (500 días)             │
│      ✓ Sin límite diario                │
│      ✓ Stocks, Crypto, Forex           │
│                                         │
│  ⚡ Tiempo Real:                         │
│  └─→ Finnhub                            │
│      ✓ Cotizaciones actuales           │
│      ✓ Perfiles de empresas            │
│      ✓ Búsqueda de símbolos            │
│                                         │
│  🔄 Fallback:                           │
│  └─→ YFinance                           │
│      ✓ Backup en caso de fallos        │
│                                         │
└─────────────────────────────────────────┘
```

## 🧪 Tests Realizados

### Test 1: Bitcoin (Crypto 24/7)
```
✅ 500 cotizaciones obtenidas
📊 Rango: 2024-08-11 → 2025-12-23 (~500 días)
💰 Precio: $58,722.49 → $87,503.00
```

### Test 2: Apple (Stock)
```
✅ 344 cotizaciones obtenidas
📊 Rango: 2024-08-12 → 2025-12-23 (~344 días hábiles)
💰 Precio: $217.53 → $272.36
```

## 📝 Notas Importantes

1. **Status "DELAYED"**: Polygon.io a veces devuelve status "DELAYED" en lugar de "OK". Ambos son válidos y contienen datos reales.

2. **Futuros no soportados**: GC=F (Oro), CL=F (Petróleo) requieren plan de pago.

3. **Alpha Vantage marcado como deprecated**: El servicio antiguo permanece en el código pero ya no se usa.

4. **Rate Limiting**: El servicio implementa esperas automáticas de 12 segundos entre requests para respetar el límite de 5/min.

## 🚀 Próximos Pasos (Opcional)

- [ ] Migrar datos históricos de Alpha Vantage a Polygon.io
- [ ] Implementar caché de datos históricos en Redis
- [ ] Agregar endpoint para refrescar históricos bajo demanda
- [ ] Dashboard de monitoreo de uso de API

## ✅ Estado Final

**Sistema totalmente funcional con Polygon.io integrado.**

- ✅ Backend ejecutándose correctamente
- ✅ Frontend operativo
- ✅ Base de datos saludable
- ✅ Redis operativo
- ✅ Polygon.io funcionando (probado con BTC y AAPL)

## 🔗 API Key

**Polygon.io API Key:** `eoIVHT9YPoIdOeuvMD7fzmhfOx5Ou0B_`

**Plan:** Free Tier
- Requests ilimitados por día
- 5 requests por minuto
- Hasta 2 años de histórico
