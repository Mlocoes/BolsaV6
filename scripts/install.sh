#!/bin/bash

################################################################################
# BolsaV6 - Sistema de Gestión de Carteras de Inversión
# Script de Instalación Profesional
#
# Este script automatiza la instalación completa del sistema BolsaV6
# incluyendo verificación de dependencias, configuración inicial y
# creación del usuario administrador.
#
# Autor: BolsaV6 Team
# Versión: 1.0.0
# Fecha: $(date +%Y-%m-%d)
################################################################################

set -e  # Salir si hay algún error

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # Sin color

# Variables globales
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"
ENV_EXAMPLE="${PROJECT_DIR}/.env.example"

################################################################################
# Funciones de Utilidad
################################################################################

print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║              BolsaV6 - Instalación del Sistema                 ║"
    echo "║        Sistema de Gestión de Carteras de Inversión            ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

################################################################################
# Verificación de Dependencias
################################################################################

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

check_docker() {
    print_step "Verificando Docker..."
    
    if check_command docker; then
        DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
        print_success "Docker encontrado: v${DOCKER_VERSION}"
        
        # Verificar que Docker esté corriendo
        if ! docker info &> /dev/null; then
            print_error "Docker no está corriendo. Por favor, inicie Docker y vuelva a ejecutar este script."
            exit 1
        fi
        return 0
    else
        print_warning "Docker no encontrado"
        return 1
    fi
}

check_docker_compose() {
    print_step "Verificando Docker Compose..."
    
    # Verificar docker compose (nuevo formato)
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version | awk '{print $4}' | head -1)
        print_success "Docker Compose encontrado: v${COMPOSE_VERSION}"
        DOCKER_COMPOSE_CMD="docker compose"
        return 0
    # Verificar docker-compose (formato antiguo)
    elif check_command docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
        print_success "Docker Compose encontrado: v${COMPOSE_VERSION}"
        DOCKER_COMPOSE_CMD="docker-compose"
        return 0
    else
        print_warning "Docker Compose no encontrado"
        return 1
    fi
}

check_python() {
    print_step "Verificando Python 3..."
    
    if check_command python3; then
        PYTHON_VERSION=$(python3 --version | awk '{print $2}')
        print_success "Python 3 encontrado: v${PYTHON_VERSION}"
        return 0
    else
        print_warning "Python 3 no encontrado"
        return 1
    fi
}

install_dependencies() {
    print_header
    echo -e "${YELLOW}Instalando dependencias faltantes...${NC}"
    echo ""
    
    # Detectar sistema operativo
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            # Debian/Ubuntu
            print_info "Sistema detectado: Debian/Ubuntu"
            echo ""
            
            print_step "Actualizando repositorios..."
            sudo apt-get update
            
            if ! check_command docker; then
                print_step "Instalando Docker..."
                sudo apt-get install -y docker.io
                sudo systemctl start docker
                sudo systemctl enable docker
                sudo usermod -aG docker $USER
                print_success "Docker instalado"
                print_warning "Debe cerrar sesión y volver a iniciarla para que los cambios de grupo surtan efecto."
            fi
            
            if ! check_command docker-compose && ! docker compose version &> /dev/null; then
                print_step "Instalando Docker Compose..."
                sudo apt-get install -y docker-compose-plugin
                print_success "Docker Compose instalado"
            fi
            
            if ! check_command python3; then
                print_step "Instalando Python 3..."
                sudo apt-get install -y python3 python3-pip
                print_success "Python 3 instalado"
            fi
            
        elif [ -f /etc/redhat-release ]; then
            # RHEL/CentOS/Fedora
            print_info "Sistema detectado: RHEL/CentOS/Fedora"
            echo ""
            
            if ! check_command docker; then
                print_step "Instalando Docker..."
                sudo dnf install -y docker
                sudo systemctl start docker
                sudo systemctl enable docker
                sudo usermod -aG docker $USER
                print_success "Docker instalado"
            fi
            
            if ! check_command docker-compose; then
                print_step "Instalando Docker Compose..."
                sudo dnf install -y docker-compose-plugin
                print_success "Docker Compose instalado"
            fi
            
            if ! check_command python3; then
                print_step "Instalando Python 3..."
                sudo dnf install -y python3 python3-pip
                print_success "Python 3 instalado"
            fi
        fi
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        print_info "Sistema detectado: macOS"
        echo ""
        
        if ! check_command brew; then
            print_error "Homebrew no está instalado. Por favor, instale Homebrew primero:"
            print_info "https://brew.sh"
            exit 1
        fi
        
        if ! check_command docker; then
            print_step "Instalando Docker Desktop para Mac..."
            brew install --cask docker
            print_success "Docker Desktop instalado"
            print_warning "Por favor, inicie Docker Desktop y vuelva a ejecutar este script."
            exit 0
        fi
        
        if ! check_command python3; then
            print_step "Instalando Python 3..."
            brew install python3
            print_success "Python 3 instalado"
        fi
    else
        print_error "Sistema operativo no soportado: $OSTYPE"
        exit 1
    fi
    
    echo ""
    print_success "Todas las dependencias han sido instaladas"
    echo ""
}

################################################################################
# Configuración del Sistema
################################################################################

generate_secret_key() {
    python3 -c "import secrets; print(secrets.token_urlsafe(32))"
}

configure_environment() {
    print_step "Configurando variables de entorno..."
    echo ""
    
    # Verificar si .env ya existe
    RECONFIGURE=false
    if [ -f "$ENV_FILE" ]; then
        print_warning "El archivo .env ya existe."
        read -p "¿Desea sobrescribirlo? (s/N): " overwrite
        if [[ ! "$overwrite" =~ ^[Ss]$ ]]; then
            print_info "Usando configuración existente."
            # Cargar variables del .env existente
            export $(grep -v '^#' "$ENV_FILE" | xargs)
            return 0
        else
            echo ""
            print_warning "⚠️  ATENCIÓN: Cambiar las credenciales requiere eliminar la base de datos actual."
            print_warning "   Esto borrará TODOS los datos almacenados (usuarios, carteras, transacciones, etc.)."
            echo ""
            read -p "¿Está seguro de que desea continuar? (s/N): " confirm_delete
            if [[ ! "$confirm_delete" =~ ^[Ss]$ ]]; then
                print_info "Operación cancelada. Manteniendo configuración existente."
                return 0
            fi
            RECONFIGURE=true
            print_info "Se eliminarán los volúmenes de Docker para aplicar las nuevas credenciales."
            echo ""
        fi
    fi
    
    # Valores por defecto
    DEFAULT_DB_NAME="bolsav6"
    DEFAULT_DB_USER="bolsav6_user"
    DEFAULT_DB_PASSWORD_GEN=$(generate_secret_key | head -c 20)
    DEFAULT_SECRET_KEY=$(generate_secret_key)
    DEFAULT_ADMIN_USER="admin"
    DEFAULT_ADMIN_EMAIL="admin@example.com"
    DEFAULT_ADMIN_PASSWORD="Admin123!@#"
    
    # Siempre preguntar por defecto
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           Configuración de Base de Datos PostgreSQL           ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
        
        # Nombre de la base de datos
        if [ -z "$DB_NAME" ]; then
            read -p "Nombre de la base de datos [${DEFAULT_DB_NAME}]: " DB_NAME
            DB_NAME=${DB_NAME:-$DEFAULT_DB_NAME}
        fi
        
        # Usuario de la base de datos
        if [ -z "$DB_USER" ]; then
            read -p "Usuario de la base de datos [${DEFAULT_DB_USER}]: " DB_USER
            DB_USER=${DB_USER:-$DEFAULT_DB_USER}
        fi
        
        # Contraseña de la base de datos
        if [ -z "$DB_PASSWORD" ]; then
            echo -e "${YELLOW}Sugerencia de contraseña segura: ${DEFAULT_DB_PASSWORD_GEN}${NC}"
            read -sp "Contraseña de la base de datos: " DB_PASSWORD
            echo ""
            if [ -z "$DB_PASSWORD" ]; then
                DB_PASSWORD=$DEFAULT_DB_PASSWORD_GEN
                echo -e "${GREEN}Usando contraseña generada automáticamente${NC}"
            fi
        fi
        
        echo ""
        echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${CYAN}║              Configuración de Usuario Administrador            ║${NC}"
        echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        
        # Usuario administrador
        if [ -z "$ADMIN_USER" ]; then
            read -p "Nombre de usuario administrador [${DEFAULT_ADMIN_USER}]: " ADMIN_USER
            ADMIN_USER=${ADMIN_USER:-$DEFAULT_ADMIN_USER}
        fi
        
        # Email del administrador
        if [ -z "$ADMIN_EMAIL" ]; then
            read -p "Email del administrador [${DEFAULT_ADMIN_EMAIL}]: " ADMIN_EMAIL
            ADMIN_EMAIL=${ADMIN_EMAIL:-$DEFAULT_ADMIN_EMAIL}
        fi
        
        # Contraseña del administrador
        if [ -z "$ADMIN_PASSWORD" ]; then
            echo -e "${YELLOW}Sugerencia de contraseña: ${DEFAULT_ADMIN_PASSWORD}${NC}"
            read -sp "Contraseña del administrador: " ADMIN_PASSWORD
            echo ""
            if [ -z "$ADMIN_PASSWORD" ]; then
                ADMIN_PASSWORD=$DEFAULT_ADMIN_PASSWORD
                echo -e "${GREEN}Usando contraseña sugerida${NC}"
            fi
        fi
    
    echo ""
    print_step "Generando archivo .env..."
    
    # Generar SECRET_KEY si no existe
    if [ -z "$SECRET_KEY" ]; then
        SECRET_KEY=$(generate_secret_key)
    fi
    
    # Obtener todas las IPs locales para CORS
    ALL_IPS=$(hostname -I | tr ' ' '\n' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | tr '\n' ',' | sed 's/,$//')
    CORS_URLS="http://localhost:3000,http://127.0.0.1:3000"
    for ip in $(echo $ALL_IPS | tr ',' ' '); do
        CORS_URLS="${CORS_URLS},http://${ip}:3000"
    done
    
    # Crear archivo .env
    cat > "$ENV_FILE" << EOF
# ==============================================
# CONFIGURACIÓN DE BASE DE DATOS
# ==============================================
POSTGRES_USER=${DB_USER}
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=${DB_NAME}

# ==============================================
# CONFIGURACIÓN DE BACKEND
# ==============================================
DATABASE_URL=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
REDIS_URL=redis://redis:6379/0
SECRET_KEY=${SECRET_KEY}
ENVIRONMENT=production

# ==============================================
# FINNHUB API (Cotizaciones en Tiempo Real)
# ==============================================
FINNHUB_API_KEY=YOUR_FINNHUB_API_KEY_HERE
QUOTE_UPDATE_INTERVAL_MINUTES=60

# ==============================================
# ALPHA VANTAGE API (Cotizaciones Históricas)
# ==============================================
# Tier gratuito: 25 llamadas por DÍA
ALPHA_VANTAGE_API_KEY=PTL1KGN2VOZYO8KG
ALPHA_VANTAGE_RATE_LIMIT=25

# ==============================================
# SEGURIDAD
# ==============================================
CORS_ORIGINS=${CORS_URLS}
SESSION_EXPIRE_MINUTES=480
SECURE_COOKIES=false

# ==============================================
# ADMIN USER (Creado automáticamente)
# ==============================================
ADMIN_USERNAME=${ADMIN_USER}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EOF

    print_success "Archivo .env creado exitosamente"
    echo ""
    
    # Crear archivo .env para el frontend
    print_step "Generando archivo frontend/.env..."
    cat > "${PROJECT_DIR}/frontend/.env" << EOF
# Configuración del Frontend
# VITE_API_URL=http://localhost:8000/api
EOF
    print_success "Archivo frontend/.env creado exitosamente"
    echo ""
    
    # Mostrar resumen
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                 Resumen de Configuración                       ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Base de Datos:"
    echo "  Nombre: ${DB_NAME}"
    echo "  Usuario: ${DB_USER}"
    echo "  Contraseña: ********"
    echo ""
    echo "Usuario Administrador:"
    echo "  Usuario: ${ADMIN_USER}"
    echo "  Email: ${ADMIN_EMAIL}"
    echo "  Contraseña: ********"
    echo ""
    print_warning "IMPORTANTE: Guarde estas credenciales en un lugar seguro."
    echo ""
    
    read -p "Presione Enter para continuar..."
}

################################################################################
# Construcción e Inicio del Sistema
################################################################################

wait_for_db() {
    print_info "Verificando conexión a la base de datos..."
    
    cd "$PROJECT_DIR"
    
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        # Intentar conectar a PostgreSQL desde el contenedor backend
        if $DOCKER_COMPOSE_CMD exec -T backend python -c "
import asyncio
import asyncpg
import os

async def check_db():
    try:
        conn = await asyncpg.connect(
            host='db',
            port=5432,
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            database=os.getenv('POSTGRES_DB'),
            timeout=5
        )
        await conn.close()
        return True
    except Exception as e:
        return False

print('ok' if asyncio.run(check_db()) else 'fail')
" 2>/dev/null | grep -q "ok"; then
            print_success "Conexión a la base de datos verificada"
            echo ""
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        echo -n "."
        sleep 2
    done
    
    echo ""
    print_error "No se pudo conectar a la base de datos después de $MAX_ATTEMPTS intentos"
    print_info "Mostrando logs de PostgreSQL:"
    $DOCKER_COMPOSE_CMD logs db --tail=20
    exit 1
}

clean_volumes() {
    if [ "$RECONFIGURE" = true ]; then
        print_step "Deteniendo servicios y eliminando base de datos antigua..."
        echo ""
        cd "$PROJECT_DIR"
        
        # Detener servicios
        $DOCKER_COMPOSE_CMD down -v 2>/dev/null || true
        
        print_success "Base de datos antigua eliminada correctamente"
        print_info "Se creará una nueva base de datos con las credenciales actualizadas"
        echo ""
    fi
}

build_system() {
    print_step "Construyendo imágenes Docker..."
    echo ""
    
    cd "$PROJECT_DIR"
    $DOCKER_COMPOSE_CMD build
    
    print_success "Imágenes construidas exitosamente"
    echo ""
}

start_system() {
    print_step "Iniciando servicios..."
    echo ""
    
    cd "$PROJECT_DIR"
    
    # Si es reconfiguración, usar --force-recreate para asegurar nuevas credenciales
    if [ "$RECONFIGURE" = true ]; then
        print_info "Recreando contenedores con nuevas credenciales..."
        $DOCKER_COMPOSE_CMD up -d --force-recreate
    else
        $DOCKER_COMPOSE_CMD up -d
    fi
    
    # Esperar a que los servicios estén listos
    print_step "Esperando a que los servicios estén listos..."
    
    # Esperar específicamente a que la base de datos esté healthy
    print_info "Esperando a que PostgreSQL esté listo..."
    for i in {1..30}; do
        if $DOCKER_COMPOSE_CMD ps db | grep -q "healthy"; then
            break
        fi
        sleep 2
    done
    
    # Verificar estado de los contenedores
    if $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
        print_success "Servicios iniciados correctamente"
    else
        print_error "Algunos servicios no se iniciaron correctamente"
        $DOCKER_COMPOSE_CMD ps
        exit 1
    fi
    echo ""
}

run_migrations() {
    print_step "Ejecutando migraciones de base de datos..."
    echo ""
    
    cd "$PROJECT_DIR"
    
    # Esperar adicional para asegurar que PostgreSQL esté completamente listo
    print_info "Esperando a que PostgreSQL esté completamente listo..."
    sleep 5
    
    # Verificar que el backend esté corriendo
    if ! $DOCKER_COMPOSE_CMD ps backend | grep -q "Up"; then
        print_error "El backend no está corriendo. Intentando iniciarlo..."
        $DOCKER_COMPOSE_CMD up -d backend
        sleep 5
    fi
    
    # Ejecutar migraciones con Alembic con reintentos
    print_info "Ejecutando migraciones con Alembic..."
    MAX_RETRIES=3
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if $DOCKER_COMPOSE_CMD exec -T backend alembic upgrade head; then
            print_success "Migraciones ejecutadas correctamente"
            echo ""
            return 0
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                print_warning "Intento $RETRY_COUNT falló. Reintentando en 5 segundos..."
                sleep 5
            fi
        fi
    done
    
    print_error "No se pudieron ejecutar las migraciones después de $MAX_RETRIES intentos"
    echo ""
    print_info "Mostrando logs del backend para diagnóstico:"
    $DOCKER_COMPOSE_CMD logs backend --tail=50
    exit 1
}

create_admin() {
    print_step "Configurando datos iniciales (Admin + Mercados + Monedas)..."
    echo ""
    
    cd "$PROJECT_DIR"
    
    # Ejecutar script de configuración de datos maestros con reintentos
    MAX_RETRIES=3
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if $DOCKER_COMPOSE_CMD exec -T backend python setup_data.py; then
            print_success "Datos maestros configurados correctamente"
            echo ""
            return 0
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                print_warning "Intento $RETRY_COUNT falló. Reintentando en 3 segundos..."
                sleep 3
            fi
        fi
    done
    
    print_error "No se pudieron configurar los datos maestros después de $MAX_RETRIES intentos"
    echo ""
    print_info "Mostrando logs del backend para diagnóstico:"
    $DOCKER_COMPOSE_CMD logs backend --tail=30
    exit 1
}

################################################################################
# Función Principal
################################################################################

main() {
    print_header
    
    # Verificar dependencias
    MISSING_DEPS=false
    
    if ! check_docker; then
        MISSING_DEPS=true
    fi
    
    if ! check_docker_compose; then
        MISSING_DEPS=true
    fi
    
    if ! check_python; then
        MISSING_DEPS=true
    fi
    
    echo ""
    
    # Instalar dependencias si faltan
    if [ "$MISSING_DEPS" = true ]; then
        print_warning "Se detectaron dependencias faltantes."
        read -p "¿Desea instalarlas automáticamente? (S/n): " install_choice
        
        if [[ ! "$install_choice" =~ ^[Nn]$ ]]; then
            install_dependencies
            echo ""
            print_info "Dependencias instaladas. Por favor, reinicie su sesión si es necesario."
            echo ""
            
            # Re-verificar dependencias
            if ! check_docker || ! check_docker_compose; then
                print_error "No se pudieron instalar todas las dependencias. Por favor, instálelas manualmente."
                exit 1
            fi
        else
            print_error "No se pueden continuar sin las dependencias necesarias."
            exit 1
        fi
    fi
    
    # Configurar entorno
    configure_environment
    
    # Limpiar volúmenes si es necesario
    clean_volumes
    
    # Construir sistema
    build_system
    
    # Iniciar sistema
    start_system
    
    # Verificar conexión a la base de datos
    wait_for_db
    
    # Ejecutar migraciones
    run_migrations
    
    # Crear usuario administrador
    create_admin
    
    # Mensaje final
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║         ✓ Instalación completada exitosamente!                ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Acceda al sistema en:${NC}"
    echo -e "  Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "  Backend API: ${BLUE}http://localhost:8000${NC}"
    echo -e "  API Docs: ${BLUE}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "${CYAN}Comandos útiles:${NC}"
    echo "  Ver logs:           ${DOCKER_COMPOSE_CMD} logs -f"
    echo "  Detener sistema:    ${DOCKER_COMPOSE_CMD} down"
    echo "  Reiniciar sistema:  ${DOCKER_COMPOSE_CMD} restart"
    echo "  Ver estado:         ${DOCKER_COMPOSE_CMD} ps"
    echo ""
    echo -e "${YELLOW}⚠️  Recuerde cambiar la contraseña del administrador después del primer inicio de sesión.${NC}"
    echo ""
}

# Ejecutar función principal
main
