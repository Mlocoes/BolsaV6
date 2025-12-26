# ✅ Solución: Error 401 (Unauthorized) - Problema con Cookies

## 🔍 Problema Identificado

El error 401 en `/api/auth/me` ocurría porque **la cookie de sesión no se enviaba correctamente** desde el navegador al backend. 

### Causas principales:

1. **SameSite=Lax restrictivo**: Con `SameSite=lax`, el navegador NO envía cookies cuando:
   - Se accede desde una IP diferente a donde se creó la cookie
   - Ej: Cookie creada en `localhost:3000` → No se envía si accedes desde `192.168.0.161:3000`

2. **Uso de localhost**: En entornos de red local, `localhost` causa problemas porque:
   - Cada dispositivo tiene su propio `localhost`
   - Las cookies no se comparten entre IPs diferentes
   - El navegador las trata como dominios distintos

## ✅ Solución Implementada

### 1. Cambio de SameSite en Cookies (desarrollo)

**Archivo modificado**: [backend/app/api/auth.py](backend/app/api/auth.py)

```python
# ANTES (restrictivo)
response.set_cookie(
    key="session_id",
    samesite="lax",  # ❌ No funciona entre diferentes IPs
)

# DESPUÉS (flexible en desarrollo)
response.set_cookie(
    key="session_id",
    samesite="none" if settings.ENVIRONMENT == "development" else "lax",
    # ✅ Permite cookies entre cualquier IP en desarrollo
)
```

**Por qué funciona**:
- `SameSite=none` permite que la cookie se envíe entre diferentes hosts/IPs
- Solo en **desarrollo** (en producción se usa `lax` por seguridad)
- `secure=False` es necesario para HTTP (no HTTPS)

### 2. Documentación actualizada

**Archivo actualizado**: [.env.example](.env.example)

Se agregaron advertencias claras sobre NO usar `localhost`:

```bash
# ⚠️ NO USE LOCALHOST - Use la IP de red de su máquina
# Ejemplo: CORS_ORIGINS=http://192.168.0.161:3000,http://192.168.0.8:3000
CORS_ORIGINS=http://192.168.0.161:3000
```

## 🚀 Cómo Usar la Aplicación Correctamente

### Paso 1: Identificar la IP de red

```bash
# En Linux/Mac:
ip addr show | grep "inet " | grep -v "127.0.0.1"

# O simplemente:
hostname -I
```

Ejemplo de salida: `192.168.0.161`

### Paso 2: Acceder SIEMPRE por la IP de red

✅ **CORRECTO**:
```
http://192.168.0.161:3000
```

❌ **INCORRECTO** (NO usar):
```
http://localhost:3000
http://127.0.0.1:3000
```

### Paso 3: Verificar en el navegador

1. Abre DevTools (F12)
2. Ve a **Application** → **Cookies**
3. Deberías ver `session_id` con:
   - `SameSite`: `None`
   - `HttpOnly`: ✓
   - `Secure`: (vacío)

## 🔧 Configuración de CORS

Si accedes desde otros dispositivos en la red, agrégalos a `CORS_ORIGINS`:

```bash
# En el archivo .env del backend
CORS_ORIGINS=http://192.168.0.161:3000,http://192.168.0.8:3000,http://192.168.0.100:3000
```

## ⚠️ Notas de Seguridad

### Desarrollo (ENVIRONMENT=development)
- `SameSite=none` está permitido
- `secure=False` está permitido (HTTP)
- CORS permisivo para red local

### Producción (ENVIRONMENT=production)
- `SameSite=lax` (más seguro)
- `secure=True` (requiere HTTPS)
- CORS restrictivo solo a dominios específicos

## 🐛 Troubleshooting

### Error persiste después de los cambios

1. **Cerrar sesión antigua**:
   ```bash
   # Limpiar todas las sesiones en Redis
   docker-compose exec redis redis-cli FLUSHDB
   ```

2. **Limpiar cookies del navegador**:
   - DevTools → Application → Cookies → Eliminar todas

3. **Acceder desde la IP correcta**:
   - NO usar `localhost`
   - Usar la IP de red (ej: `192.168.0.161:3000`)

4. **Iniciar sesión nuevamente**:
   - Usuario: `admin`
   - Contraseña: (la configurada en `.env`)

### Verificar configuración actual

```bash
# Ver configuración de CORS
grep CORS_ORIGINS .env

# Ver logs del backend
docker-compose logs --tail=50 backend

# Ver sesiones activas
docker-compose exec redis redis-cli KEYS "session:*"
```

## 📝 Resumen

| Aspecto | Antes | Después |
|---------|-------|---------|
| **SameSite** | `lax` (restrictivo) | `none` en desarrollo |
| **Acceso** | `localhost:3000` | `192.168.0.161:3000` |
| **Cookies** | No se enviaban | ✅ Se envían correctamente |
| **Error 401** | ❌ Constante | ✅ Resuelto |

---

**Cambios aplicados**: 26 de diciembre de 2025
**Estado**: ✅ Funcionando correctamente
