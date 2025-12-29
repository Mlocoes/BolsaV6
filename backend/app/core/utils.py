"""
Utilidades comunes para el backend
"""
from decimal import Decimal
from typing import Any
import pandas as pd

def clean_decimal(val: Any) -> Decimal:
    """
    Limpia y convierte un valor a Decimal, manejando:
    - Formatos españoles (punto para miles, coma para decimales)
    - Símbolos de moneda y porcentaje
    - Valores nulos o vacíos
    """
    if pd.isna(val) or val == '': 
        return Decimal('0')
    if isinstance(val, (int, float, Decimal)): 
        return Decimal(str(val))
    
    # Normalizar formato: 
    # 1. Quitar los puntos (separadores de miles en formato ES)
    # 2. Reemplazar la coma por punto (separador decimal en formato ES)
    # 3. Quitar símbolos comunes
    s = str(val).replace('.', '').replace(',', '.').replace('%', '').replace('€', '').replace('$', '').strip()
    
    try:
        return Decimal(s) if s else Decimal('0')
    except:
        return Decimal('0')
