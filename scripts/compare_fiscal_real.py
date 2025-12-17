
import csv
import re
import requests
import sys
from datetime import datetime
from decimal import Decimal
from collections import defaultdict

# Config
# Note: Ensure the API port is correct. Using 8000 as per logs.
API_URL = "http://localhost:8000/api/fiscal/calculate"
PORTFOLIO_ID = "a715b1f7-ba10-44b1-9ad8-cbb81fee936d"
YEAR = 2024
FILE_PATH = "Plusvalia2024"

def parse_bank_float(val_str: str) -> Decimal:
    if not val_str: return Decimal(0)
    # 1.999,99 -> 1999.99
    cleaned = val_str.replace('.', '').replace(',', '.')
    return Decimal(cleaned)

def parse_bank_date(date_str: str) -> str:
    # 22.04.24 -> 2024-04-22
    try:
        dt = datetime.strptime(date_str.strip(), "%d.%m.%y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        return date_str

def parse_bank_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Normalize: Replace newlines inside quotes with spaces
    normalized_text = re.sub(r'"([^"]*)"', lambda m: m.group(0).replace('\n', ' '), content)
    
    records = []
    lines = normalized_text.split('\n')
    
    # Skip header
    start_idx = 0
    for i, line in enumerate(lines):
        if "Valor\tCuenta" in line:
            start_idx = i + 1
            break
            
    for line in lines[start_idx:]:
        if not line.strip(): continue
        parts = line.split('\t')
        if len(parts) < 8: continue
        
        try:
            # 0: Valor (Symbol)
            # ...
            # 2: Qty
            # 3: Acq Date
            # 4: Acq Value
            # 5: Sale Date
            # 6: Sale Value
            # 7: Result
            
            raw_symbol = parts[0].replace('"', '').strip()
            symbol = raw_symbol.split()[0]
            if "NVIDIA" in raw_symbol: symbol = "NVDA" # NVD vs NVDA check
            if "RIVN" in raw_symbol: symbol = "RIVN"
            
            # Map TLO to TSLA if needed, but DB likely uses TSLA? or TLO?
            # User DB has assets. Let's assume symbol matches or we fuzzy match.
            # Bank "TLO" is Tesla Xetra. DB might have "TSLA" or "TLO".
            
            qty = parse_bank_float(parts[2])
            date_acq = parse_bank_date(parts[3])
            val_acq = parse_bank_float(parts[4])
            date_sale = parse_bank_date(parts[5])
            val_sale = parse_bank_float(parts[6])
            result = parse_bank_float(parts[7])
            
            records.append({
                "symbol": symbol,
                "qty": qty,
                "date_acq": date_acq,
                "val_acq": val_acq,
                "date_sale": date_sale,
                "val_sale": val_sale,
                "result": result,
                "raw_symbol": raw_symbol
            })
        except Exception as e:
            print(f"Error parsing line: {line} -> {e}")

    return records

def get_system_report():
    try:
        resp = requests.get(API_URL, params={"portfolio_id": PORTFOLIO_ID, "year": YEAR})
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"API Error: {e}")
        sys.exit(1)

def compare(bank_records, system_report):
    system_items = []
    for ys in system_report.get('years', []):
        if ys['year'] == YEAR:
            system_items = ys['items']
            # Also check pending wash sales if they are excluded from items?
            # Schema says: items: List[FiscalResultItem], pending_wash_sales: List[FiscalResultItem]
            # Usually items contains everything closed this year. 
            # Logic in service: results.append(item) -> items.append(item).
            # pending_wash_sales is ALSO appended if wash sale.
            # So 'items' should contain ALL closed operations.
            break
            
    print(f"Bank Records: {len(bank_records)}")
    print(f"System Records: {len(system_items)}")
    
    # Create System Index
    # Key: (Symbol, Qty, SaleDate) -> List[Item]
    sys_index = defaultdict(list)
    for it in system_items:
        # DB symbol might be different. 
        # API returns asset_symbol.
        s = it['asset_symbol']
        # Normalize known mappings
        if s == "NVDA": s = "NVD" # Reverse map if needed
        if s == "TSLA": s = "TLO"
        
        k = (s, Decimal(str(it['quantity_sold'])), it['sale_date'].split('T')[0])
        sys_index[k].append(it)
        
    print("\nCOMPARISON (Bank vs System)")
    print(f"{'SYM':<5} | {'QTY':<8} | {'SALE DATE':<10} | {'RES BANK':>10} | {'RES SYS':>10} | {'DIFF':>10} | {'NOTES'}")
    print("-" * 80)
    
    grand_diff = Decimal(0)
    
    for brec in bank_records:
        # Try finding match
        # Try direct symbol
        s = brec['symbol']
        key = (s, brec['qty'], brec['date_sale'])
        candidates = sys_index.get(key)
        
        # Try alternate symbols if not found
        if not candidates:
            alts = []
            if s == "TLO": alts = ["TSLA", "TESLA"]
            if s == "NVD": alts = ["NVDA"]
            for alt in alts:
                key_alt = (alt, brec['qty'], brec['date_sale'])
                candidates = sys_index.get(key_alt)
                if candidates: break
        
        match = None
        if candidates:
            # Try matching logic
            # Prioritize by Acquisition Date
            for cand in candidates:
                c_acq = cand['acquisition_date'].split('T')[0]
                if c_acq == brec['date_acq']:
                    match = cand
                    break
            
            # If no date match, match by closest result
            if not match:
                best_diff = Decimal('Infinity')
                for cand in candidates:
                    c_res = Decimal(str(cand['gross_result']))
                    d = abs(c_res - brec['result'])
                    if d < best_diff:
                        best_diff = d
                        match = cand
            
            if match:
                candidates.remove(match) # Consume

        if match:
            sys_res = Decimal(str(match['gross_result']))
            diff = sys_res - brec['result']
            note = ""
            if abs(diff) > 0.05:
                # Check specifics
                sys_acq_val = Decimal(str(match['acquisition_value']))
                bank_acq_val = brec['val_acq']
                if abs(sys_acq_val - bank_acq_val) > 1:
                    note += f"AcqValDiff({bank_acq_val} vs {sys_acq_val}) "
                
                sys_sale_val = Decimal(str(match['sale_value']))
                bank_sale_val = brec['val_sale']
                if abs(sys_sale_val - bank_sale_val) > 1:
                    note += f"SaleValDiff({bank_sale_val} vs {sys_sale_val}) "
                    
            if match.get('is_wash_sale'):
                note += " [WASH]"
                
            print(f"{brec['symbol']:<5} | {brec['qty']:<8} | {brec['date_sale']} | {brec['result']:>10.2f} | {sys_res:>10.2f} | {diff:>10.2f} | {note}")
            grand_diff += diff
        else:
            print(f"{brec['symbol']:<5} | {brec['qty']:<8} | {brec['date_sale']} | {brec['result']:>10.2f} | {'MISSING':>10} | {'N/A':>10} | Not in System")

    print("-" * 80)
    print(f"Total Diff: {grand_diff}")

if __name__ == "__main__":
    b = parse_bank_file(FILE_PATH)
    s = get_system_report()
    compare(b, s)
