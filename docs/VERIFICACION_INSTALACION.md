# ✅ Lista de Verificación de Instalación - BolsaV6

Este documento sirve como guía rápida para verificar que el sistema se instaló correctamente.

## 📋 Pre-Instalación

### Verificar Dependencias
```bash
# Docker
docker --version
# Debe mostrar: Docker version 20.10+ o superior

# Docker Compose
docker compose version
# o
docker-compose --version
# Debe mostrar: v2.0+ o v1.29+ o superior

# Python (para script de instalación)
python3 --version
# Debe mostrar: Python 3.10+ o superior
```

## 🚀 Proceso de Instalación

### Ejecutar Instalador
```bash
cd BolsaV6
./install.sh
```

### Durante la Instalación - Verificar:
- [ ] El script detecta Docker y Docker Compose correctamente
- [ ] Se solicitan credenciales de base de datos
- [ ] Se solicitan credenciales de usuario administrador
- [ ] Se genera el archivo `.env` correctamente
- [ ] Las imágenes Docker se construyen sin errores
- [ ] Los servicios se inician correctamente
- [ ] Las migraciones de Alembic se ejecutan sin errores
- [ ] El usuario administrador se crea exitosamente

## 🔍 Post-Instalación

### 1. Verificar Estado de Servicios
```bash
docker compose ps
```

**Resultado esperado:** Todos los servicios en estado "Up"
```
NAME                  STATUS
bolsav6_backend       Up (healthy)
bolsav6_db           Up (healthy)
bolsav6_frontend     Up
bolsav6_redis        Up (healthy)
```

### 2. Verificar Logs (sin errores graves)
```bash
# Ver todos los logs
docker compose logs --tail=50

# Ver logs específicos
docker compose logs backend --tail=30
docker compose logs frontend --tail=30
docker compose logs db --tail=20
```

**Buscar:** No debe haber errores tipo ERROR o CRITICAL.

### 3. Verificar Conectividad

#### Frontend
```bash
curl -I http://localhost:3000
```
**Resultado esperado:** `HTTP/1.1 200 OK` o similar

#### Backend API
```bash
curl http://localhost:8000/health
```
**Resultado esperado:** `{"status":"healthy","version":"1.0.0"}`

#### Documentación API
Abrir en navegador: http://localhost:8000/docs
**Resultado esperado:** Página de Swagger UI visible

### 4. Verificar Base de Datos

#### Conectarse a PostgreSQL
```bash
docker compose exec db psql -U [POSTGRES_USER] -d [POSTGRES_DB]
```

#### Listar tablas
```sql
\dt
```

**Resultado esperado:** Debe mostrar las siguientes tablas:
- `alembic_version`
- `assets`
- `portfolios`
- `quotes`
- `transactions`
- `users`

#### Verificar usuario administrador
```sql
SELECT username, email, is_admin, is_active FROM users WHERE is_admin = true;
```

**Resultado esperado:** Debe mostrar el usuario administrador creado.

```sql
\q
```

### 5. Prueba de Login (Frontend)

1. Abrir navegador en: http://localhost:3000
2. Debe aparecer la página de login
3. Ingresar credenciales del administrador configuradas en `.env`
4. Debe iniciar sesión correctamente y mostrar el dashboard

### 6. Prueba de API (Backend)

#### Login vía API
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"[TU_CONTRASEÑA]"}'
```

**Resultado esperado:** Debe retornar un token de sesión.

#### Health Check
```bash
curl http://localhost:8000/health
```

**Resultado esperado:** `{"status":"healthy","version":"1.0.0"}`

## 📊 Verificación Funcional

### Crear Cartera
1. Ir a "Carteras" en el frontend
2. Crear una nueva cartera
3. Verificar que se crea correctamente

### Crear Activo
1. Ir a "Activos"
2. Crear un nuevo activo (ej: AAPL)
3. Verificar que se crea correctamente

### Crear Transacción
1. Ir a "Transacciones"
2. Crear una transacción de compra
3. Verificar que se crea correctamente

## 🛠️ Scripts de Gestión

### Detener Sistema
```bash
./stop.sh
```
**Verificar:** `docker compose ps` debe mostrar servicios detenidos

### Iniciar Sistema
```bash
./start.sh
```
**Verificar:** `docker compose ps` debe mostrar servicios corriendo

## ❌ Problemas Comunes

### Error: "Port already in use"
**Solución:**
```bash
# Verificar qué está usando el puerto
sudo lsof -i :3000
sudo lsof -i :8000

# Detener el proceso o cambiar puerto en docker-compose.yml
```

### Error: "Cannot connect to database"
**Solución:**
```bash
# Reiniciar base de datos
docker compose restart db
sleep 10
docker compose restart backend
```

### Error: "Cannot login"
**Solución:**
```bash
# Verificar credenciales en .env
cat .env | grep ADMIN

# Recrear usuario administrador
docker compose exec backend python create_admin.py
```

## ✅ Checklist Final

- [ ] Todos los servicios están corriendo (docker compose ps)
- [ ] Frontend accesible en http://localhost:3000
- [ ] Backend API accesible en http://localhost:8000
- [ ] Documentación API accesible en http://localhost:8000/docs
- [ ] Login funciona correctamente
- [ ] Se pueden crear carteras
- [ ] Se pueden crear activos
- [ ] Se pueden crear transacciones
- [ ] Los logs no muestran errores graves
- [ ] Base de datos tiene todas las tablas
- [ ] Usuario administrador existe y puede hacer login

## 🎉 ¡Instalación Exitosa!

Si todos los puntos están verificados, la instalación fue exitosa.

### Próximos Pasos

1. **Cambiar contraseña del administrador**
   - Ir a "Perfil" o "Usuarios" en el frontend
   - Cambiar la contraseña por una más segura

2. **Configurar API de Finnhub** (opcional pero recomendado)
   - Registrarse en: https://finnhub.io/register
   - Obtener API key
   - Agregar a `.env`: `FINNHUB_API_KEY=su_api_key`
   - Reiniciar backend: `docker compose restart backend`

3. **Crear usuarios adicionales**
   - Usar el panel de "Usuarios" como administrador

4. **Explorar funcionalidades**
   - Crear carteras
   - Agregar activos
   - Registrar transacciones
   - Importar desde Excel
   - Ver reportes y gráficos

---

**Documentación completa:** [INSTALACION.md](INSTALACION.md)

**Soporte:** Abra un issue en GitHub si encuentra problemas.
