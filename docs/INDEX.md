# 📚 Documentación de BolsaV6

Este directorio contiene toda la documentación del sistema BolsaV6.

## Documentos Disponibles

### 🚀 Instalación y Configuración

#### [`INSTALACION.md`](./INSTALACION.md)
**Descripción:** Guía completa de instalación del sistema

**Contenido:**
- Prerequisitos del sistema
- Instalación automática con `install.sh`
- Instalación manual paso a paso
- Configuración avanzada
- Troubleshooting (10+ escenarios)

---

#### [`VERIFICACION_INSTALACION.md`](./VERIFICACION_INSTALACION.md)
**Descripción:** Checklist para verificar la instalación

**Contenido:**
- Verificaciones pre-instalación
- Verificaciones post-instalación
- Tests funcionales
- Problemas comunes y soluciones

---

### 📥 Importación y Gestión de Datos

#### [`IMPORTACION_AUTOMATICA.md`](./IMPORTACION_AUTOMATICA.md)
**Descripción:** Importación automática de activos y cotizaciones históricas

**Contenido:**
- Auto-registro de activos nuevos
- Descarga automática de 3 años de histórico
- Flujo de importación mejorado
- Ejemplos de respuesta
- Casos de uso
- Configuración de período
- Solución de problemas

---

### 🛠️ Operación y Mantenimiento

#### [`SOLUCION_CORS.md`](./SOLUCION_CORS.md)
**Descripción:** Guía de solución de problemas CORS

**Contenido:**
- Explicación de CORS y por qué ocurre
- Solución 1: Actualización manual de CORS_ORIGINS
- Solución 2: Reinstalación automática
- **Importante:** Por qué `docker compose restart` NO funciona
- Comandos de diagnóstico
- Verificación de la solución

---

### 💾 Base de Datos

#### [`ESQUEMA_BASE_DATOS.md`](./ESQUEMA_BASE_DATOS.md)
**Descripción:** Documentación completa del esquema de la base de datos

**Contenido:**
- Cadena de migraciones de Alembic
- Estructura detallada de todas las tablas
- Tipos ENUM (TransactionType, AssetType)
- Constraints y Foreign Keys
- Índices y optimizaciones
- Comandos de validación y mantenimiento
- Operaciones prohibidas
- Changelog de cambios en el esquema

---

#### [`CORRECCION_ESQUEMA.md`](./CORRECCION_ESQUEMA.md)
**Descripción:** Resumen ejecutivo de la corrección del esquema

**Contenido:**
- Problemas identificados en el esquema original
- Soluciones implementadas
- Estado final validado
- Resultados antes/después
- Herramientas creadas
- Commits relacionados

---

## Estructura de la Documentación

```
docs/
├── INDEX.md                           # Este archivo (índice)
├── README.md                          # Documentación general del proyecto
├── INSTALACION.md                     # Guía de instalación
├── VERIFICACION_INSTALACION.md        # Checklist de verificación
├── SOLUCION_CORS.md                   # Troubleshooting CORS
├── ESQUEMA_BASE_DATOS.md              # Schema de BD completo
└── CORRECCION_ESQUEMA.md              # Resumen de correcciones
```

---

## Convenciones de Documentación

### Formato
- ✅ **Markdown:** Todos los documentos en formato `.md`
- ✅ **Nombres:** MAYÚSCULAS con guiones bajos (`MI_DOCUMENTO.md`)
- ✅ **Encoding:** UTF-8
- ✅ **Line endings:** LF (Unix)

### Estilo
- ✅ **Encabezados:** Usar jerarquía clara (H1 → H2 → H3)
- ✅ **Emojis:** Usar emojis para mejor visualización (📚 🚀 🔧 💾 ⚠️ ✅)
- ✅ **Código:** Especificar lenguaje en bloques de código
- ✅ **Enlaces:** Usar enlaces relativos para documentos internos

### Estructura Estándar
Cada documento debe incluir:
1. **Título principal (H1)**
2. **Descripción breve**
3. **Tabla de contenidos** (para docs largos)
4. **Contenido organizado en secciones**
5. **Fecha de última actualización**

---

## Añadir Nueva Documentación

Cuando crees un nuevo documento:

1. **Guárdalo en este directorio** (`docs/`)
2. **Usa el formato Markdown** (`.md`)
3. **Añade entrada en este INDEX.md** con descripción
4. **Incluye fecha de última actualización** al final del documento
5. **Haz commit descriptivo:**
   ```bash
   git add docs/MI_NUEVO_DOC.md
   git commit -m "docs: añadir documentación de [tema]"
   ```

---

## Documentación Futura Planificada

- [ ] `API.md` - Documentación completa de la API REST
- [ ] `ARQUITECTURA.md` - Arquitectura del sistema
- [ ] `DESARROLLO.md` - Guía para desarrolladores
- [ ] `TESTING.md` - Estrategia y ejecución de tests
- [ ] `DEPLOYMENT.md` - Guía de despliegue a producción
- [ ] `SEGURIDAD.md` - Prácticas de seguridad implementadas
- [ ] `PERFORMANCE.md` - Optimizaciones y métricas
- [ ] `CHANGELOG.md` - Historial de cambios por versión

---

## Contribuir a la Documentación

La documentación es tan importante como el código. Si encuentras:
- ❌ Información desactualizada
- ❌ Errores o imprecisiones
- ❌ Falta de claridad

Por favor:
1. Actualiza el documento correspondiente
2. Haz commit con mensaje descriptivo
3. Actualiza la fecha de última actualización

---

## Enlaces Rápidos

- **Instalación:** [`INSTALACION.md`](./INSTALACION.md)
- **Troubleshooting CORS:** [`SOLUCION_CORS.md`](./SOLUCION_CORS.md)
- **Schema BD:** [`ESQUEMA_BASE_DATOS.md`](./ESQUEMA_BASE_DATOS.md)
- **Scripts:** [`../scripts/README.md`](../scripts/README.md)

---

**Última actualización:** 11 de diciembre de 2025
