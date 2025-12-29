# Plan de Conversión de Tablas

## Patrón de Transactions (FUNCIONA ✓)
1. `import Handsontable from 'handsontable'` (no HotTable)
2. `const hotTableRef = useRef<HTMLDivElement>(null);`
3. `const hotInstance = useRef<Handsontable | null>(null);`
4. useEffect que crea `new Handsontable(hotTableRef.current, {...})`
5. Columnas con `renderer: function(instance, td, row, col, prop, value) {...}`
6. div simple con ref: `<div ref={hotTableRef} className="..."></div>`

## Convertir:
- [x] Positions
- [ ] Portfolios  
- [ ] Quotes
- [ ] Users
- [ ] FiscalReport
