# 📋 PLAN: Nueva Pestaña "Gestión de Activos" en Importación

**Fecha:** 28 de enero de 2026  
**Objetivo:** Añadir control visual y funcional para gestionar el estado de sincronización de activos

---

## 1. ESTRUCTURA GENERAL

### 1.1 Sistema de Pestañas (Tabs)
Convertir la página Import.tsx en un sistema de pestañas con:

```
┌─────────────────────────────────────────────────────┐
│ 📥 Importación de Datos                             │
├─────────────────────────────────────────────────────┤
│ [Importar Excel] [Cotizaciones] [⚙️ Gestión Activos]│
├─────────────────────────────────────────────────────┤
│                                                     │
│          Contenido de la pestaña activa            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Pestañas:**
- **Pestaña 1**: Importar Excel (contenido actual - transacciones)
- **Pestaña 2**: Cotizaciones (histórico/últimas - contenido actual)
- **Pestaña 3**: ⚙️ Gestión de Activos (NUEVA)

---

## 2. PESTAÑA "GESTIÓN DE ACTIVOS" - DISEÑO

### 2.1 Layout Principal

```
┌────────────────────────────────────────────────────────────┐
│  ⚙️ Gestión de Activos y Sincronización                   │
├────────────────────────────────────────────────────────────┤
│  [Filtros]  🔴 Sin Datos (3) | 🟡 Incompletos (21) |       │
│             🟠 Desact. (0)    | 🟢 Completos (24)  |       │
│             ⛔ Inactivos (4)                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Tabla Handsontable con todos los activos                 │
│  (Símbolo, Nombre, Estado, Cotizaciones, Sync, Acciones)  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  [Refrescar] [Desactivar Seleccionados] [Activar Selecc.] │
└────────────────────────────────────────────────────────────┘
```

### 2.2 Filtros Interactivos (Chips)

Botones tipo "chip" para filtrar:
- 🔴 **Sin Datos** (no_data) - Activos sin ninguna cotización
- 🟡 **Incompletos** (incomplete_data) - Cobertura < 94%
- 🟠 **Desactualizados** (outdated) - Última cotización > 7 días
- 🟢 **Completos** (complete) - Todo OK
- ⛔ **Inactivos** (sync_enabled = false) - No sincronizan

Al hacer clic en un chip, filtra la tabla para mostrar solo ese grupo.

---

## 3. TABLA DE ACTIVOS (Handsontable)

### 3.1 Columnas

| Columna | Ancho | Tipo | Descripción |
|---------|-------|------|-------------|
| ☑️ Checkbox | 40px | checkbox | Selección múltiple |
| **Símbolo** | 120px | text | Ticker del activo |
| **Nombre** | 300px | text | Nombre completo |
| **Tipo** | 80px | dropdown | STOCK/ETF/CRYPTO/FOREX |
| **Estado** | 120px | custom | 🔴/🟡/🟠/🟢 + Label |
| **Cotizaciones** | 100px | numeric | Total de cotizaciones |
| **Última** | 110px | date | Fecha última cotización |
| **Días** | 60px | numeric | Días sin actualizar |
| **Cobertura** | 90px | percent | % cobertura |
| **Sync** | 80px | checkbox | ✅/❌ Activo/Inactivo |

### 3.2 Funcionalidades de la Tabla
- ✅ Ordenar por cualquier columna
- ✅ Filtro avanzado (Handsontable filters)
- ✅ Selección múltiple con checkbox
- ✅ Edición in-line del campo **Sync** (activar/desactivar)
- ✅ Coloración condicional:
  - Filas inactivas: fondo gris tenue
  - Días > 7: texto naranja
  - Cobertura < 50%: texto rojo

---

## 4. ACCIONES DISPONIBLES

### 4.1 Acciones Individuales (por fila)
- **Toggle Sync**: Click en checkbox de Sync → activa/desactiva sync_enabled

### 4.2 Acciones Masivas (botones inferiores)
- **Desactivar Seleccionados**: Pone sync_enabled=False para todos los seleccionados
- **Activar Seleccionados**: Pone sync_enabled=True para todos los seleccionados
- **Importar Faltantes (Seleccionados)**: Ejecuta importación solo para los activos seleccionados

### 4.3 Modal de Confirmación
Antes de cambiar el estado de múltiples activos:
```
┌────────────────────────────────────┐
│ ⚠️ Confirmar Cambios               │
├────────────────────────────────────┤
│ Vas a DESACTIVAR sincronización    │
│ para 5 activos:                    │
│                                    │
│  • NKLA                            │
│  • BEDBATH                         │
│  • ...                             │
│                                    │
│ Estos activos NO importarán       │
│ cotizaciones automáticamente.      │
│                                    │
│        [Cancelar]  [Confirmar]     │
└────────────────────────────────────┘
```

---

## 5. BACKEND - ENDPOINTS NECESARIOS

### 5.1 Endpoints Existentes (ya disponibles)
✅ `GET /quotes/assets/coverage` - Obtiene cobertura de todos los activos

### 5.2 Endpoints Nuevos a Crear

#### A. Actualizar Sync de un Activo
```python
PATCH /api/assets/{asset_id}/sync
Body: { "sync_enabled": true|false }
Response: { "success": true, "asset": {...} }
```

#### B. Actualizar Sync Masivo
```python
POST /api/assets/bulk-sync
Body: { 
  "asset_ids": ["uuid1", "uuid2", ...],
  "sync_enabled": true|false 
}
Response: { 
  "success": true, 
  "updated_count": 5,
  "assets": [...]
}
```

#### C. Obtener Todos los Activos con Estado
```python
GET /api/assets/management
Query params: ?status=incomplete_data (opcional)
Response: {
  "assets": [
    {
      "id": "uuid",
      "symbol": "TSLA",
      "name": "Tesla Inc",
      "asset_type": "STOCK",
      "sync_enabled": true,
      "coverage": {
        "reason": "complete",
        "total_quotes": 500,
        "last_date": "2026-01-28",
        "days_since_last_update": 0,
        "coverage_ratio": 0.98
      }
    }
  ],
  "stats": {
    "no_data": 3,
    "incomplete_data": 21,
    "outdated": 0,
    "complete": 24,
    "inactive": 4
  }
}
```

---

## 6. FLUJO DE USUARIO

### Caso 1: Desactivar activos sin datos
1. Usuario abre pestaña "Gestión de Activos"
2. Click en chip "🔴 Sin Datos (3)"
3. Tabla filtra y muestra solo 3 activos
4. Selecciona todos con checkbox
5. Click en "Desactivar Seleccionados"
6. Modal de confirmación aparece
7. Confirma → Backend actualiza sync_enabled=False
8. Toast success + tabla se actualiza

### Caso 2: Activar un activo específico
1. Usuario busca "NKLA" en la tabla
2. Click en checkbox de columna Sync (❌ → ✅)
3. Petición PATCH al backend
4. Actualización inmediata en la tabla

### Caso 3: Ver detalle de grupo
1. Click en chip "🟡 Incompletos (21)"
2. Tabla muestra solo activos incompletos
3. Usuario revisa cuáles tienen más cobertura
4. Decide activar/desactivar según necesidad

---

## 7. ESTRUCTURA DE CÓDIGO

### 7.1 Componentes Nuevos
```
frontend/src/components/
  ├── Tabs.tsx (componente reutilizable de pestañas)
  └── AssetManagement.tsx (pestaña nueva)
```

### 7.2 Modificaciones
```
frontend/src/pages/Import.tsx
  - Convertir a sistema de pestañas
  - Mover contenido actual a sub-componentes
  - Integrar AssetManagement.tsx

backend/app/api/assets.py
  - Añadir endpoint PATCH /assets/{id}/sync
  - Añadir endpoint POST /assets/bulk-sync
  - Añadir endpoint GET /assets/management
```

---

## 8. TECNOLOGÍAS Y LIBRERÍAS

**Frontend**:
- React Tabs (o implementación custom con Tailwind)
- Handsontable (ya usado)
- Axios (ya usado)
- React-Toastify (ya usado)

**Backend**:
- FastAPI (ya usado)
- SQLAlchemy Async (ya usado)
- Pydantic schemas para validación

---

## 9. CONSIDERACIONES TÉCNICAS

### 9.1 Performance
- Tabla puede tener 48+ activos → Handsontable es eficiente
- Virtualización automática de filas
- Cargar datos una sola vez, filtrar en cliente

### 9.2 Seguridad
- Validar que usuario autenticado pueda modificar assets
- Rate limiting en endpoints de modificación masiva
- Logging de cambios de sync_enabled

### 9.3 UX/UI
- Feedback inmediato en cambios (optimistic updates)
- Loading states en operaciones masivas
- Tooltips explicativos en chips de estado
- Confirmación solo para cambios masivos

---

## 10. FASES DE IMPLEMENTACIÓN

### Fase 1: Backend
1. Crear endpoints nuevos en `assets.py`
2. Añadir schemas Pydantic
3. Probar con curl/Postman

### Fase 2: Frontend - Estructura
1. Crear componente `Tabs.tsx`
2. Refactorizar `Import.tsx` con pestañas
3. Crear componente base `AssetManagement.tsx`

### Fase 3: Frontend - Funcionalidad
1. Implementar tabla con Handsontable
2. Implementar filtros por estado
3. Implementar acciones individuales
4. Implementar acciones masivas

### Fase 4: Testing y Pulido
1. Probar todos los flujos
2. Ajustar estilos
3. Añadir tooltips y ayuda
4. Commit y push

---

## ✅ RESUMEN DEL PLAN

**¿Qué se añade?**
- Nueva pestaña "Gestión de Activos" en página Importación
- Tabla completa con TODOS los activos y su estado de sincronización
- Filtros rápidos por grupo (Sin Datos, Incompletos, etc.)
- Capacidad de activar/desactivar sync_enabled individual o masivamente
- 3 nuevos endpoints en el backend

**Beneficios:**
- ✅ Control total sobre qué activos sincronizan
- ✅ Visibilidad clara del estado de cada activo
- ✅ Ahorro de recursos API desactivando activos problemáticos
- ✅ Interfaz centralizada para gestión de activos

**Estado actual de activos:**
- 📊 Total: 48 activos
- 🟢 Completos: 24 (50.0%)
- 🟡 Incompletos: 21 (43.8%)
- 🔴 Sin datos: 3 (6.2%)
- ⛔ Inactivos: 4 activos

---

## 📝 NOTAS DE IMPLEMENTACIÓN

- El sistema ya tiene la base de datos con el campo `sync_enabled`
- Ya existe lógica para detectar estado de cobertura
- Los endpoints de cobertura ya están funcionando
- Solo falta crear la interfaz visual y los endpoints de modificación

---

**Esperando aprobación para comenzar implementación...**
