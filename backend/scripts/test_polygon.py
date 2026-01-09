import asyncio
import os
import sys
from dotenv import load_dotenv
import requests

# Cargar env para obtener la API KEY
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
load_dotenv(os.path.join(root_dir, '.env'))

apiKey = os.getenv("POLYGON_API_KEY")

def test_polygon(symbol):
    print(f"Probando Polygon para {symbol}...")
    url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}/range/1/day/2026-01-01/2026-01-09"
    params = {"apiKey": apiKey}
    
    resp = requests.get(url, params=params)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    
    if data.get("results"):
        print(f"¡Éxito! {len(data['results'])} resultados encontrados.")
        for r in data["results"]:
            from datetime import datetime
            dt = datetime.fromtimestamp(r['t']/1000)
            print(f"  {dt.date()}: {r['c']}")
    else:
        print("No se encontraron resultados en Polygon.")
        print(data)

if __name__ == "__main__":
    test_polygon("AGAE")
