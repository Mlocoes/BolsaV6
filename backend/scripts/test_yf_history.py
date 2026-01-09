import yfinance as yf
from datetime import datetime

def test_yf_history(symbol):
    print(f"Probando yf.Ticker({symbol}).history...")
    ticker = yf.Ticker(symbol)
    df = ticker.history(start="2026-01-01", end="2026-01-09")
    print(f"DataFrame:\n{df}")
    if df.empty:
        print("EL DATAFRAME ESTÁ VACÍO")
    else:
        print(f"Encontradas {len(df)} filas.")
        for idx, row in df.iterrows():
            print(f"  {idx}: {row['Close']}")

if __name__ == "__main__":
    test_yf_history("DIA.MC")
