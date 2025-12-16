PROMPT PARA IMPLEMENTACIÓN DEL CÁLCULO DE PLUSVALÍA FISCAL (ESPAÑA)
Rol

Actúa como arquitecto de software y experto en fiscalidad española de inversiones financieras.
Tu objetivo es diseñar e implementar en Python un módulo robusto para el cálculo de plusvalías y minusvalías fiscales en España para activos financieros.

Contexto funcional

El sistema forma parte de una aplicación de gestión de inversiones.
Debe calcular el resultado fiscal derivado de operaciones de compra y venta de activos financieros realizadas por una persona física residente fiscal en España.

Los resultados se usarán para:

Informes fiscales

Resumen anual de IRPF

Integración futura con modelos de declaración

Activos financieros a soportar

Implementa inicialmente soporte para:

Acciones cotizadas

ETFs

Fondos de inversión

Criptomonedas (sin compensación automática entre ejercicios)

La arquitectura debe permitir extensión futura a otros activos.

Normativa fiscal española a aplicar

Implementa las siguientes reglas:

Cálculo de la ganancia o pérdida patrimonial

Ganancia = Valor de transmisión – Valor de adquisición

Incluir:

Comisiones de compra y venta

Gastos directamente asociados

Método FIFO obligatorio

Las ventas deben imputarse a las compras más antiguas disponibles

Debe soportar ventas parciales

Compensación de pérdidas y ganancias

Compensación dentro del mismo ejercicio

Separar:

Rendimientos del capital mobiliario

Ganancias/pérdidas patrimoniales

Escala del ahorro vigente
Implementa una función configurable para los tramos, por ejemplo:

Hasta 6.000 €

6.000 – 50.000 €

50.000 – 200.000 €

Más de 200.000 €

(No hardcodear valores; deben ser parametrizables)

Regla de los 2 meses

Detectar recompra del mismo activo dentro de los 2 meses posteriores

Marcar la pérdida como no computable hasta futura venta válida

Modelo de datos esperado

Define claramente estructuras de datos (dataclasses o clases) para:

Asset

Operation

fecha

tipo (BUY / SELL)

cantidad

precio_unitario

comisiones

PositionLot (para FIFO)

FiscalResult

Requisitos técnicos

Lenguaje: Python 3.11+

Estilo:

Código limpio y legible

Tipado estático (typing)

Uso de dataclasses

Separación clara entre:

Lógica fiscal

Modelo de datos

Cálculo numérico

Preparado para test unitarios (pytest)

Funcionalidades mínimas a implementar

Procesador FIFO de operaciones

Cálculo exacto de plusvalía/minusvalía por operación

Agregación anual por activo y total

Aplicación de reglas fiscales

Cálculo del impuesto estimado

Generación de un resumen fiscal estructurado (dict o JSON)

Ejemplo de uso esperado

Incluye un ejemplo completo de:

Lista de operaciones

Ejecución del cálculo

Salida fiscal detallada

Restricciones

No usar librerías externas de fiscalidad

No asumir conexión con Hacienda

No simplificar reglas fiscales

Entregables

Código Python completo del módulo

Explicación breve de la arquitectura

Ejemplo funcional ejecutable

Puntos claros donde adaptar la normativa futura

Nivel de detalle esperado

Muy alto.
El código debe ser apto para producción, no pseudocódigo.