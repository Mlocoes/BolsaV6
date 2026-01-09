import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { applyPassiveEventsPatch } from './utils/passiveEvents';

// Aplicar parches de rendimiento
applyPassiveEventsPatch();

import 'handsontable/styles/ht-theme-main.min.css';
import './styles/index.css'
import { registerAllModules } from 'handsontable/registry';

// Registro global de módulos de Handsontable
registerAllModules();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
