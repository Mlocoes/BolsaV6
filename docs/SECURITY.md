# 🔐 Política de Seguridad - BolsaV6

## Versiones Soportadas

| Versión | Soportada | Notas |
|---------|-----------|-------|
| 6.x     | ✅ Sí     | Versión actual con todas las correcciones de seguridad |
| < 6.0   | ❌ No     | Versiones anteriores no reciben actualizaciones |

## Arquitectura de Seguridad

### Autenticación
- **Sesiones Redis**: Las sesiones se almacenan en Redis con TTL configurable (por defecto 8 horas)
- **Cookies HttpOnly**: Los tokens de sesión se almacenan en cookies HttpOnly, no accesibles desde JavaScript
- **Secure Cookies**: En producción, las cookies usan `secure=True` y `samesite=strict`
- **Sin JWT en localStorage**: No se almacenan tokens en localStorage/sessionStorage

### Autorización
- **Verificación de propiedad**: Todas las operaciones verifican que el recurso pertenece al usuario
- **Roles**: Sistema de roles con `is_admin` para operaciones administrativas
- **Dependencias reutilizables**: `get_current_user`, `get_user_portfolio`, `get_or_404`

### Protección contra Ataques
- **Rate Limiting**: Implementado con slowapi
  - Login: 5 intentos/minuto
  - Operaciones de escritura: 30/minuto
  - Backup: 5/minuto
- **CORS restrictivo**: En producción, solo orígenes configurados explícitamente
- **Trusted Hosts**: Proxy headers solo aceptados de hosts conocidos en producción
- **Validación de entrada**: Pydantic valida todos los datos de entrada

### Contraseñas
- **Hashing**: bcrypt con salt automático
- **Requisitos**:
  - Mínimo 8 caracteres
  - Al menos una mayúscula
  - Al menos una minúscula
  - Al menos un número
  - Al menos un carácter especial (!@#$%^&*(),.?":{}|<>)

### Manejo de Errores
- Los errores internos se loguean en el servidor
- Los clientes reciben mensajes genéricos sin detalles técnicos
- No se exponen stack traces ni estructura de base de datos

## Configuración de Seguridad

### Variables de Entorno Requeridas
\`\`\`env
# Credenciales de admin (SIN valores por defecto)
ADMIN_USERNAME=tu_usuario_seguro
ADMIN_EMAIL=admin@tudominio.com
ADMIN_PASSWORD=contraseña_compleja_aquí

# Clave secreta para sesiones
SECRET_KEY=clave_aleatoria_32_caracteres_minimo

# Entorno
ENVIRONMENT=production
SECURE_COOKIES=true
\`\`\`

## Reportar Vulnerabilidades

Si descubres una vulnerabilidad de seguridad:

1. **NO** abras un issue público
2. Envía un email al administrador del proyecto
3. Incluye descripción, pasos para reproducir e impacto potencial

## Auditorías de Seguridad

### Última Auditoría: 28 de enero de 2026

Ver [AUDITORIA_SEGURIDAD.md](../AUDITORIA_SEGURIDAD.md) para detalles completos.

## Dependencias

Última revisión: 28/01/2026 - 0 vulnerabilidades
