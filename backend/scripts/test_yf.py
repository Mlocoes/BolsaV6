import yfinance as yf
from datetime import date, timedelta

def test_yf(symbol):
    print(f"Probando {symbol}...")
    ticker = yf.Ticker(symbol)
    start = date(2026, 1, 1)
    end = date(2026, 1, 9)
    print(f"Rango: {start} a {end}")
    
    df = ticker.history(start=start, end=end, interval="1d")
    print("\nDataFrame:")
    print(df)
    
    if df.empty:
        print("¡VACÍO!")
    else:
        for idx, row in df.iterrows():
            print(f"{idx.date()}: Close={row['Close']}, Vol={row['Volume']}")

if __name__ == "__main__":
    test_yf("AGAE")
