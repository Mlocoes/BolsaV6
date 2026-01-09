import requests
from datetime import datetime, date
import time

def test_manual_history(symbol):
    print(f"Probando histórico manual para {symbol}...")
    # Jan 1 2026 UTC
    p1 = int(datetime(2026, 1, 1).timestamp())
    # Jan 9 2026 UTC
    p2 = int(datetime(2026, 1, 9).timestamp())
    
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?period1={p1}&period2={p2}&interval=1d"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    resp = requests.get(url, headers=headers)
    print(f"Status: {resp.status_code}")
    data = resp.json()
    
    chart_data = data.get('chart', {}).get('result', [{}])[0]
    if not chart_data:
        print("No hay datos en chart_data.")
        print(data)
        return
        
    timestamps = chart_data.get('timestamp', [])
    indicators = chart_data.get('indicators', {}).get('quote', [{}])[0]
    
    closes = indicators.get('close', [])
    
    print(f"Encontrados {len(timestamps)} puntos.")
    for i in range(len(timestamps)):
        dt = datetime.fromtimestamp(timestamps[i])
        print(f"  {dt.date()}: {closes[i]}")

if __name__ == "__main__":
    test_manual_history("AGAE")
