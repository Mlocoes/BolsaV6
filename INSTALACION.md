# 📦 Guía de Instalación de BolsaV6

**Sistema de Gestión de Carteras de Inversión**

## 📋 Tabla de Contenidos

- [Requisitos del Sistema](#requisitos-del-sistema)
- [Instalación Automática](#instalación-automática)
- [Instalación Manual](#instalación-manual)
- [Configuración Avanzada](#configuración-avanzada)
- [Gestión del Sistema](#gestión-del-sistema)
- [Solución de Problemas](#solución-de-problemas)

---

## 🖥️ Requisitos del Sistema

### Hardware Mínimo
- **CPU:** 2 núcleos
- **RAM:** 4 GB
- **Disco:** 10 GB libres

### Hardware Recomendado
- **CPU:** 4+ núcleos
- **RAM:** 8+ GB
- **Disco:** 20+ GB libres (SSD preferible)

### Software Necesario

#### Obligatorio
- **Docker:** v20.10+
- **Docker Compose:** v2.0+ (o docker-compose v1.29+)
- **Python:** 3.10+ (solo para el script de instalación)

#### Sistemas Operativos Soportados
- ✅ Ubuntu 20.04 / 22.04 / 24.04
- ✅ Debian 10 / 11 / 12
- ✅ CentOS 8 / RHEL 8+
- ✅ Fedora 35+
- ✅ macOS 11+ (Big Sur o superior)
- ✅ Windows 10/11 con WSL2

---

## 🚀 Instalación Automática

La forma más rápida y sencilla de instalar BolsaV6 es utilizando el script de instalación automática.

### Paso 1: Descargar el Proyecto

```bash
# Clonar el repositorio
git clone https://github.com/Mlocoes/BolsaV6.git
cd BolsaV6
```

### Paso 2: Ejecutar el Instalador

```bash
# Dar permisos de ejecución
chmod +x install.sh

# Ejecutar instalación
./install.sh
```

### Paso 3: Seguir las Instrucciones

El instalador realizará automáticamente:

1. ✅ Verificación de dependencias (Docker, Docker Compose, Python)
2. ✅ Instalación de dependencias faltantes (si el usuario acepta)
3. ✅ Configuración interactiva de credenciales
4. ✅ Generación del archivo `.env`
5. ✅ Construcción de imágenes Docker
6. ✅ Inicio de servicios
7. ✅ Ejecución de migraciones de base de datos
8. ✅ Creación del usuario administrador

### Configuración Durante la Instalación

El instalador le solicitará:

#### Base de Datos PostgreSQL
- **Nombre de la base de datos** (default: `bolsav6`)
- **Usuario de la base de datos** (default: `bolsav6_user`)
- **Contraseña de la base de datos** (generada automáticamente si no se especifica)

#### Usuario Administrador
- **Nombre de usuario** (default: `admin`)
- **Email** (default: `admin@bolsav6.local`)
- **Contraseña** (sugerencia proporcionada)

### Acceder al Sistema

Una vez completada la instalación:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Documentación API:** http://localhost:8000/docs

**Credenciales de acceso:** Las que configuró durante la instalación.

⚠️ **IMPORTANTE:** Cambie la contraseña del administrador después del primer inicio de sesión.

---

## 🔧 Instalación Manual

Si prefiere realizar la instalación paso a paso:

### Paso 1: Instalar Dependencias

#### En Ubuntu/Debian:
```bash
# Actualizar repositorios
sudo apt update

# Instalar Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker

# Instalar Docker Compose
sudo apt install -y docker-compose-plugin

# Agregar usuario al grupo docker (para no usar sudo)
sudo usermod -aG docker $USER

# Aplicar cambios de grupo (o reiniciar sesión)
newgrp docker
```

#### En CentOS/RHEL/Fedora:
```bash
# Instalar Docker
sudo dnf install -y docker

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Instalar Docker Compose
sudo dnf install -y docker-compose-plugin

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

#### En macOS:
```bash
# Instalar Docker Desktop con Homebrew
brew install --cask docker

# Iniciar Docker Desktop manualmente desde Aplicaciones
```

### Paso 2: Clonar el Repositorio

```bash
git clone https://github.com/Mlocoes/BolsaV6.git
cd BolsaV6
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con su editor favorito
nano .env
# o
vim .env
```

**Valores importantes a modificar en `.env`:**

```env
# Base de datos
POSTGRES_USER=su_usuario
POSTGRES_PASSWORD=su_contraseña_segura
POSTGRES_DB=bolsav6

# Backend
DATABASE_URL=postgresql+asyncpg://su_usuario:su_contraseña_segura@db:5432/bolsav6
SECRET_KEY=genere_una_clave_secreta_aleatoria_de_32_caracteres

# Usuario administrador
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@sudominio.com
ADMIN_PASSWORD=su_contraseña_admin_segura
```

**Generar SECRET_KEY segura:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Paso 4: Construir e Iniciar el Sistema

```bash
# Construir imágenes
docker compose build

# Iniciar servicios
docker compose up -d

# Verificar estado
docker compose ps
```

### Paso 5: Ejecutar Migraciones

```bash
# Esperar a que la base de datos esté lista (10-15 segundos)
sleep 15

# Ejecutar migraciones
docker compose exec backend alembic upgrade head
```

### Paso 6: Crear Usuario Administrador

```bash
# Ejecutar script de creación de admin
docker compose exec backend python create_admin.py
```

---

## ⚙️ Configuración Avanzada

### API de Cotizaciones (Finnhub)

BolsaV6 utiliza la API de Finnhub para obtener cotizaciones en tiempo real.

1. Regístrese en: https://finnhub.io/register
2. Obtenga su API Key gratuita
3. Edite `.env` y agregue:
   ```env
   FINNHUB_API_KEY=su_api_key_de_finnhub
   ```
4. Reinicie el backend:
   ```bash
   docker compose restart backend
   ```

**Límites del plan gratuito:**
- 60 peticiones por minuto
- 500 peticiones por día

### Acceso desde Otras Computadoras

Para acceder al sistema desde otras computadoras en la red local:

1. Obtener la IP de su máquina:
   ```bash
   hostname -I | awk '{print $1}'
   ```

2. Editar `.env` y agregar la IP a CORS_ORIGINS:
   ```env
   CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.100:3000
   ```

3. Reiniciar servicios:
   ```bash
   docker compose restart
   ```

4. Acceder desde otra computadora:
   - Frontend: `http://192.168.1.100:3000`
   - API: `http://192.168.1.100:8000`

### Modo Producción

Para ejecutar en modo producción:

1. Editar `.env`:
   ```env
   ENVIRONMENT=production
   SECURE_COOKIES=true
   ```

2. Configurar un proxy inverso (Nginx/Apache) con SSL
3. Cambiar puertos en `docker-compose.yml` si es necesario
4. Usar contraseñas fuertes para todos los servicios

---

## 🎮 Gestión del Sistema

### Scripts de Gestión

El sistema incluye scripts para facilitar la gestión:

```bash
# Iniciar el sistema
./start.sh

# Detener el sistema
./stop.sh

# Ver instalación completa
./install.sh
```

### Comandos Docker Compose

```bash
# Ver estado de los servicios
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar un servicio
docker compose restart backend

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (⚠️ elimina datos)
docker compose down -v

# Reconstruir servicios
docker compose build --no-cache
docker compose up -d
```

### Acceso a la Base de Datos

```bash
# Conectarse a PostgreSQL
docker compose exec db psql -U bolsav6_user -d bolsav6

# Backup de la base de datos
docker compose exec db pg_dump -U bolsav6_user bolsav6 > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20241211.sql | docker compose exec -T db psql -U bolsav6_user -d bolsav6
```

### Actualizar el Sistema

```bash
# Detener servicios
docker compose down

# Actualizar código
git pull origin main

# Reconstruir imágenes
docker compose build

# Ejecutar migraciones
docker compose up -d
docker compose exec backend alembic upgrade head

# Verificar estado
docker compose ps
```

---

## 🔍 Solución de Problemas

### El Instalador Falla al Detectar Docker

**Problema:** Docker instalado pero el script no lo detecta.

**Solución:**
```bash
# Verificar instalación
docker --version
docker compose version

# Si docker-compose no funciona, probar:
docker-compose --version

# Reiniciar sesión después de agregar usuario al grupo docker
newgrp docker
# o cerrar sesión y volver a iniciar
```

### Error: "Cannot connect to database"

**Problema:** El backend no puede conectarse a PostgreSQL.

**Solución:**
```bash
# Verificar que la base de datos está corriendo
docker compose ps

# Ver logs de la base de datos
docker compose logs db

# Reiniciar la base de datos
docker compose restart db

# Esperar unos segundos y reiniciar backend
sleep 10
docker compose restart backend
```

### Error: "Port already in use"

**Problema:** Los puertos 3000, 8000, 5432 o 6379 están en uso.

**Solución 1: Liberar los puertos**
```bash
# Ver qué está usando el puerto
sudo lsof -i :3000
sudo lsof -i :8000

# Detener el proceso
sudo kill -9 <PID>
```

**Solución 2: Cambiar puertos en docker-compose.yml**
```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Cambiar puerto externo
  backend:
    ports:
      - "8001:8000"  # Cambiar puerto externo
```

### Frontend muestra "Network Error"

**Problema:** El frontend no puede conectarse al backend.

**Solución:**
```bash
# Verificar que backend está corriendo
docker compose ps

# Verificar CORS en .env
# Debe incluir: CORS_ORIGINS=http://localhost:3000

# Verificar frontend/.env
cat frontend/.env
# Debe tener: VITE_API_URL=http://localhost:8000/api

# Reiniciar servicios
docker compose restart
```

### No puedo iniciar sesión con el usuario admin

**Problema:** Las credenciales del administrador no funcionan.

**Solución:**
```bash
# Verificar que el usuario fue creado
docker compose exec backend python create_admin.py

# Si ya existe, verificar credenciales en .env
cat .env | grep ADMIN

# Para recrear el usuario, conectarse a la base de datos
docker compose exec db psql -U bolsav6_user -d bolsav6

# En psql:
DELETE FROM users WHERE username = 'admin';
\q

# Volver a crear el usuario
docker compose exec backend python create_admin.py
```

### Migraciones de Alembic fallan

**Problema:** Error al ejecutar `alembic upgrade head`.

**Solución:**
```bash
# Ver estado de migraciones
docker compose exec backend alembic current

# Ver historial
docker compose exec backend alembic history

# Si hay conflictos, resetear a una versión específica
docker compose exec backend alembic downgrade <revision>
docker compose exec backend alembic upgrade head

# En último caso, recrear la base de datos (⚠️ elimina datos)
docker compose down -v
docker compose up -d
sleep 15
docker compose exec backend alembic upgrade head
docker compose exec backend python create_admin.py
```

### Sistema muy lento

**Problema:** El sistema responde lentamente.

**Solución:**
```bash
# Verificar uso de recursos
docker stats

# Reiniciar servicios
docker compose restart

# Liberar caché de Docker
docker system prune -a

# Verificar logs de errores
docker compose logs --tail=100

# Aumentar recursos en Docker Desktop (Mac/Windows)
# Settings > Resources > Aumentar CPU/Memory
```

---

## 📞 Soporte

### Documentación Adicional

- **README Principal:** [README.md](README.md)
- **API Docs:** http://localhost:8000/docs (cuando el sistema está corriendo)

### Reportar Problemas

Si encuentra un problema no listado aquí:

1. Verifique los logs: `docker compose logs`
2. Abra un issue en GitHub con:
   - Descripción del problema
   - Logs relevantes
   - Sistema operativo
   - Versiones de Docker y Docker Compose

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

**¡Gracias por usar BolsaV6! 🚀**
