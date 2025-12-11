# 🔒 Solución de Problemas CORS - BolsaV6

## ❌ Error CORS Común

```
Access to XMLHttpRequest at 'http://192.168.0.8:8000/api/auth/login' 
from origin 'http://192.168.0.8:3000' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🔍 ¿Qué es CORS?

**CORS (Cross-Origin Resource Sharing)** es un mecanismo de seguridad del navegador que bloquea peticiones HTTP entre diferentes orígenes (dominios, puertos o protocolos).

En BolsaV6:
- **Frontend**: `http://192.168.0.8:3000` (origen A)
- **Backend**: `http://192.168.0.8:8000` (origen B)

Aunque ambos están en la misma IP, **los puertos diferentes los hacen orígenes distintos**, por lo que el navegador bloquea las peticiones por seguridad.

## 🛠️ Solución Rápida

### Opción 1: Actualizar CORS_ORIGINS manualmente

1. **Editar el archivo `.env`**:
   ```bash
   nano .env
   ```

2. **Actualizar la línea CORS_ORIGINS** con todas las IPs necesarias:
   ```env
   CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.0.8:3000,http://192.168.0.10:3000
   ```
   
   **Nota**: Agregar todas las IPs desde las que se accederá al sistema.

3. **Reiniciar el backend**:
   ```bash
   docker compose restart backend
   ```

### Opción 2: Reinstalar con el script mejorado

El script de instalación ahora detecta automáticamente todas las IPs locales:

```bash
./install.sh
```

Esto configurará CORS para todas las interfaces de red automáticamente.

## 📋 Verificación

### 1. Verificar configuración CORS actual

```bash
# Ver CORS_ORIGINS en .env
cat .env | grep CORS_ORIGINS
```

**Debe incluir** la IP desde la que estás accediendo:
```
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.0.8:3000
```

### 2. Verificar que el backend cargó la configuración

```bash
# Reiniciar backend
docker compose restart backend

# Ver logs
docker compose logs backend --tail=20
```

**Debe mostrar** "Application startup complete" sin errores.

### 3. Probar desde el navegador

1. Abrir DevTools (F12) en el navegador
2. Ir a la pestaña **Network**
3. Intentar hacer login
4. Verificar la petición OPTIONS (preflight):
   - ✅ Status: **200 OK** (correcto)
   - ❌ Status: **400 Bad Request** (CORS mal configurado)

## 🔧 Soluciones Avanzadas

### Acceso desde múltiples dispositivos

Si accede desde diferentes computadoras/dispositivos:

```env
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.0.8:3000,http://192.168.0.10:3000,http://192.168.0.15:3000
```

### Desarrollo (Permitir todos los orígenes)

⚠️ **SOLO PARA DESARROLLO - NUNCA EN PRODUCCIÓN**

Modificar `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Reiniciar:
```bash
docker compose restart backend
```

### Usar un proxy reverso (Nginx)

Para producción, es recomendable usar un proxy reverso:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

Así frontend y backend comparten el mismo origen.

## 🌐 Encontrar tu IP local

### En Linux/macOS:
```bash
hostname -I
# o
ip addr show
# o
ifconfig
```

### En Windows:
```cmd
ipconfig
```

Buscar la IP que comienza con `192.168.x.x` o `10.x.x.x`

## 📊 Diagnóstico Completo

Si sigue sin funcionar:

```bash
# 1. Ver configuración actual
cat .env | grep CORS

# 2. Ver logs del backend
docker compose logs backend --tail=50

# 3. Verificar que backend está escuchando
curl http://localhost:8000/health
# Debe retornar: {"status":"healthy","version":"1.0.0"}

# 4. Verificar CORS con curl
curl -H "Origin: http://192.168.0.8:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8000/api/auth/login \
     -v

# Debe incluir en la respuesta:
# Access-Control-Allow-Origin: http://192.168.0.8:3000
# Access-Control-Allow-Credentials: true
```

## ✅ Checklist de Solución

- [ ] Identificar IP local desde la que accedes
- [ ] Agregar esa IP a CORS_ORIGINS en .env
- [ ] Reiniciar backend: `docker compose restart backend`
- [ ] Limpiar caché del navegador (Ctrl+Shift+Del)
- [ ] Recargar la página (Ctrl+F5)
- [ ] Verificar en DevTools que la petición OPTIONS retorna 200

## 🆘 Soporte Adicional

Si el problema persiste:

1. **Ver logs completos**:
   ```bash
   docker compose logs backend > backend_logs.txt
   ```

2. **Verificar estado de servicios**:
   ```bash
   docker compose ps
   ```

3. **Reportar el problema** con:
   - IP desde la que accede
   - Contenido de CORS_ORIGINS en .env
   - Logs del backend
   - Screenshot del error en DevTools

---

**Documentación relacionada**: [INSTALACION.md](INSTALACION.md)
