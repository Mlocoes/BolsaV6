Plan de Implementación: Gestión de Mercados y Administación
Este plan detalla la creación de un sistema de gestión de mercados/bolsas para centralizar la información de moneda y país, facilitando la importación de transacciones y permitiendo al usuario personalizar estos datos.

Cambios Propuestos
Backend
[NEW] 
market.py
Crear el modelo Market con campos: 
id
, name, currency, country.
[NEW] 
market.py
Crear esquemas Pydantic MarketBase, MarketCreate, MarketUpdate y MarketResponse.
[NEW] 
markets.py
Implementar endpoints CRUD para la gestión de mercados.
[MODIFY] 
main.py
Registrar el nuevo router de mercados.
[NEW] 
seed_markets.py
Script para poblar la tabla con datos iniciales (NASDAQ, NYSE, XETRA, CONTINUO, etc.).
Frontend
[NEW] 
Administration.tsx
Crear la pantalla de administración con una tabla AG Grid editable para los mercados.
Implementar formularios de creación/edición.
[MODIFY] 
App.tsx
Añadir la ruta /administration y el enlace en la navegación.
Importación de Transacciones
[MODIFY] 
import_transactions.py
Refactorizar la lógica de descubrimiento de activos:
Limitar la búsqueda de símbolos a Yahoo Finance.
Buscar el nombre del mercado en el campo Valor del Excel.
Usar la tabla Market para obtener la moneda y el nombre normalizado del mercado.
Plan de Verificación
Pruebas Automatizadas
Ejecutar el script de seeding y verificar la tabla en la base de datos.
Probar los endpoints CRUD de mercados.
Verificación Manual
Acceder a la nueva pantalla de Administración y editar un mercado.
Realizar una importación de transacciones (ej: DIA en CONTINUO) y verificar que asigna la moneda EUR basada en la tabla de mercados.



Task:

Corrección de Moneda y Mercado en Activos
Este plan detalla los pasos para corregir el registro de activos, asegurando que la moneda y el mercado se asignen correctamente.

Pasos
 Investigar cómo se crean los activos (manual y automático)
 Gestión de Mercados y Administración
 Crear modelo y esquemas de Market en el backend
 Crear API CRUD para mercados
 Script de carga inicial de mercados principales
 Crear pantalla de Administración en el frontend con tabla editable
 Integrar enlace de Administración en la navegación
 Refactorización de Importación Proactiva
 Adaptar 
import_transactions.py
 para usar la tabla de Market
 Simplificar 
yfinance_service.py
 centrándolo únicamente en Yahoo
 Verificar importación correcta de DIA y otros activos europeos