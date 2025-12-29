# 🔧 Guía de Instalación - BolsaV6

## 📋 Modos de Instalación

BolsaV6 soporta dos modos de instalación:

### 1. 👤 Modo Interactivo (Recomendado)

El script te hace preguntas para configurar el sistema:

```bash
# Limpiar variables de entorno previas (si existen)
unset AUTO_INSTALL DB_NAME DB_USER DB_PASSWORD ADMIN_USER ADMIN_EMAIL ADMIN_PASSWORD

# Ejecutar instalación interactiva
bash scripts/install.sh
```

O usar el script helper:

```bash
bash scripts/test_interactive.sh
```

**El script preguntará:**
- Nombre de la base de datos
- Usuario de PostgreSQL
- Contraseña de PostgreSQL
- Usuario administrador
- Email del administrador
- Contraseña del administrador
- URLs permitidas para CORS

### 2. 🤖 Modo Automático (Para CI/CD)

Instalación sin preguntas usando variables de entorno:

```bash
export AUTO_INSTALL="true"
export DB_NAME="bolsav6"
export DB_USER="bolsav6_user"
export DB_PASSWORD="MiPasswordSegura123!"
export ADMIN_USER="admin"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="AdminPass123!"
export CORS_URLS="http://localhost:5173,http://localhost:4173"

bash scripts/install.sh
```

O en una sola línea:

```bash
AUTO_INSTALL="true" DB_NAME="bolsav6" DB_USER="bolsav6_user" \
  DB_PASSWORD="TestPass123!" ADMIN_USER="admin" \
  ADMIN_EMAIL="admin@test.com" ADMIN_PASSWORD="admin123" \
  bash scripts/install.sh
```

---

## ⚠️ Problemas Comunes

### Problema: El script no hace preguntas

**Causa**: Variables de entorno `AUTO_INSTALL` persisten de ejecuciones anteriores.

**Solución**:

```bash
# Limpiar variables
unset AUTO_INSTALL DB_NAME DB_USER DB_PASSWORD ADMIN_USER ADMIN_EMAIL ADMIN_PASSWORD CORS_URLS

# Verificar que están limpias
env | grep AUTO_INSTALL
# (no debe mostrar nada)

# Ejecutar instalación
bash scripts/install.sh
```

### Problema: "read -p" bloquea en modo automático

**Causa**: Ya está corregido en la última versión del script.

**Solución**: El script detecta `AUTO_INSTALL=true` y omite todas las preguntas.

---

## 🧪 Scripts de Prueba

### test_interactive.sh
Limpia variables y ejecuta en modo interactivo:
```bash
bash scripts/test_interactive.sh
```

### test_install.sh
Ejecuta en modo automático con valores de prueba:
```bash
bash scripts/test_install.sh
```

---

## 📝 Verificación del Modo

El script mostrará claramente en qué modo está operando:

**Modo Interactivo:**
```
╔════════════════════════════════════════════════════════════════╗
║               👤 MODO INTERACTIVO                              ║
╚════════════════════════════════════════════════════════════════╝
```

**Modo Automático:**
```
╔════════════════════════════════════════════════════════════════╗
║               🤖 MODO AUTOMÁTICO ACTIVADO                      ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🔄 Reinstalación

Si ya tienes un `.env` existente:

```bash
# Opción 1: Mantener configuración actual
bash scripts/reinstall.sh

# Opción 2: Reconfigurar desde cero
rm .env
bash scripts/install.sh
```

---

## 📊 Estado del Sistema

Verificar servicios después de la instalación:

```bash
docker compose ps
```

Todos los servicios deben estar "Up" o "Healthy".

---

## 🆘 Soporte

Si tienes problemas:

1. Verifica que Docker y Docker Compose estén instalados.
2. Limpia las variables de entorno con `unset`.
3. Revisa los logs en el directorio `logs/` del proyecto.
4. Consulta [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
