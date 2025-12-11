# 🛠️ Scripts de BolsaV6

Este directorio contiene todos los scripts de utilidad para el sistema BolsaV6.

## Scripts Disponibles

### 🚀 Instalación y Gestión

#### `install.sh`
**Descripción:** Script de instalación completa del sistema  
**Uso:** `./scripts/install.sh`

**Funcionalidades:**
- Detección automática de dependencias (Docker, Docker Compose, Python)
- Instalación automática de dependencias faltantes
- Configuración interactiva de credenciales
- Auto-detección de IPs locales para CORS
- Doble confirmación antes de eliminar datos
- Creación automática de usuario administrador

**Opciones:**
```bash
./scripts/install.sh              # Instalación interactiva
RECONFIGURE=true ./scripts/install.sh  # Reinstalar eliminando datos
```

---

#### `start.sh`
**Descripción:** Inicia todos los servicios del sistema  
**Uso:** `./scripts/start.sh`

**Funcionalidades:**
- Inicia contenedores Docker (backend, frontend, db, redis)
- Verifica que los servicios estén corriendo
- Muestra URLs de acceso al sistema

---

#### `stop.sh`
**Descripción:** Detiene todos los servicios del sistema  
**Uso:** `./scripts/stop.sh`

**Funcionalidades:**
- Detiene todos los contenedores
- Preserva los datos (no elimina volúmenes)

---

### 🔍 Validación y Diagnóstico

#### `validate_schema.sh`
**Descripción:** Valida el esquema de la base de datos  
**Uso:** `./scripts/validate_schema.sh`

**Funcionalidades:**
- Verifica contenedores Docker
- Valida versión de migraciones de Alembic
- Comprueba cadena de migraciones
- Lista tablas, ENUMs, constraints e índices
- Detecta diferencias entre modelos SQLAlchemy y BD
- Genera reporte completo con estado del esquema

**Salida esperada:**
```
✓ Contenedores corriendo
✓ Versión correcta: 29bc6e996add
✓ No hay diferencias
✓ Validación completada exitosamente
```

---

## Permisos de Ejecución

Todos los scripts tienen permisos de ejecución. Si necesitas añadir permisos:

```bash
chmod +x scripts/*.sh
```

---

## Añadir Nuevos Scripts

Cuando crees un nuevo script:

1. **Guárdalo en este directorio** (`scripts/`)
2. **Hazlo ejecutable:** `chmod +x scripts/nombre_script.sh`
3. **Añade documentación** en este README
4. **Usa el template estándar:**

```bash
#!/bin/bash
set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Nombre del Script${NC}"
echo -e "${BLUE}============================================${NC}"

# Tu código aquí...

echo -e "${GREEN}✓ Completado${NC}"
```

---

## Convenciones

- ✅ **Nombres:** Usa snake_case para nombres de scripts (`mi_script.sh`)
- ✅ **Shebang:** Siempre incluye `#!/bin/bash` al inicio
- ✅ **Error handling:** Usa `set -e` para salir en caso de error
- ✅ **Colores:** Usa los colores estándar para feedback visual
- ✅ **Documentación:** Documenta cada script en este README

---

## Scripts Futuros Planificados

- [ ] `backup.sh` - Backup de base de datos
- [ ] `restore.sh` - Restaurar backup
- [ ] `migrate.sh` - Aplicar migraciones pendientes
- [ ] `test.sh` - Ejecutar tests
- [ ] `deploy.sh` - Deploy a producción

---

**Última actualización:** 11 de diciembre de 2025
