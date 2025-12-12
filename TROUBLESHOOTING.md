# 🔧 Solución de Problemas - BolsaV6

## ❌ ERR_CONNECTION_REFUSED al hacer login

### Síntoma
```
POST http://192.168.0.8:8000/api/auth/login net::ERR_CONNECTION_REFUSED
```

### Causas Comunes

#### 1. IP incorrecta en frontend/.env

**Problema**: El frontend está configurado con una IP que no corresponde a tu máquina.

**Verificar**:
```bash
# Ver IP actual de tu máquina
hostname -I

# Ver configuración del frontend
cat frontend/.env
```

**Solución**:

**Para desarrollo local (recomendado)**:
```bash
# frontend/.env
VITE_API_URL=http://localhost:8000/api
```

**Para acceso desde otros dispositivos en la red**:
```bash
# Primero obtener tu IP actual
IP=$(hostname -I | awk '{print $1}')

# Actualizar frontend/.env
echo "VITE_API_URL=http://$IP:8000/api" > frontend/.env
```

**Reconstruir frontend**:
```bash
docker compose up -d --build frontend
```

#### 2. Backend no está escuchando correctamente

**Verificar servicios**:
```bash
docker compose ps
```

Todos deben estar "Up" o "Healthy".

**Verificar logs del backend**:
```bash
docker compose logs backend
```

**Reiniciar backend**:
```bash
docker compose restart backend
```

#### 3. Firewall bloqueando el puerto 8000

**Verificar si el puerto está abierto**:
```bash
# Desde la máquina local
curl http://localhost:8000/api/health

# Desde otro dispositivo en la red
curl http://TU_IP:8000/api/health
```

**Abrir puerto en firewall (Ubuntu/Debian)**:
```bash
sudo ufw allow 8000/tcp
sudo ufw reload
```

---

## 🌐 CORS Errors

### Síntoma
```
Access to XMLHttpRequest at 'http://localhost:8000/api/...' from origin 'http://192.168.0.161:3000' has been blocked by CORS policy
```

### Solución

**Actualizar CORS_ORIGINS en .env**:
```bash
# Editar .env del proyecto raíz
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://192.168.0.161:3000
```

**Reiniciar backend**:
```bash
docker compose restart backend
```

---

## 🔐 Error de Autenticación

### Síntoma
```
401 Unauthorized
```

### Verificar credenciales por defecto

**Usuario**: admin  
**Email**: admin@bolsav6.com  
**Contraseña**: admin123

### Recrear usuario administrador

```bash
docker compose exec backend python -m app.scripts.create_admin
```

---

## 🐳 Servicios no inician

### Verificar logs
```bash
docker compose logs
```

### Reiniciar completamente
```bash
docker compose down
docker compose up -d
```

### Limpiar y reinstalar
```bash
docker compose down -v
rm .env
bash scripts/install.sh
```

---

## 📊 Base de datos vacía después de instalación

### Ejecutar migraciones
```bash
docker compose exec backend alembic upgrade head
```

### Crear usuario administrador
```bash
docker compose exec backend python -m app.scripts.create_admin
```

---

## 🔄 Cambios en .env no se aplican

### Problema
Los cambios en `.env` requieren recrear los contenedores.

### Solución
```bash
docker compose down
docker compose up -d
```

Para el frontend específicamente:
```bash
docker compose up -d --build frontend
```

---

## 📝 Ver configuración actual

### Variables de entorno del backend
```bash
docker compose exec backend env | grep -E "(DATABASE|REDIS|CORS|SECRET)"
```

### Variables de entorno del frontend
```bash
docker compose exec frontend env | grep VITE
```

---

## 🆘 Obtener ayuda adicional

1. Revisa los logs detallados:
   ```bash
   docker compose logs -f backend
   docker compose logs -f frontend
   ```

2. Verifica el estado de la red:
   ```bash
   docker network inspect bolsav6_default
   ```

3. Consulta la documentación completa en [docs/](../docs/)
