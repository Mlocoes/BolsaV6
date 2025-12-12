"""
Script para descargar cotizaciones históricas de activos existentes
"""
import asyncio
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import engine
from app.models.asset import Asset
from app.models.quote import Quote
from app.services.alpha_vantage_service import AlphaVantageService

async def download_quotes_for_assets():
    """Descargar cotizaciones para activos sin cotizaciones"""
    
    alpha_service = AlphaVantageService()
    
    async with AsyncSession(engine) as session:
        # Obtener todos los activos primero
        result = await session.execute(select(Asset))
        all_assets = result.scalars().all()
        
        # Convertir a lista de diccionarios para evitar problemas de lazy loading
        assets_data = [
            {"id": asset.id, "symbol": asset.symbol, "name": asset.name}
            for asset in all_assets
        ]
        
        # Filtrar los que no tienen cotizaciones
        assets_without_quotes = []
        for asset_dict in assets_data:
            quote_count = await session.execute(
                select(func.count(Quote.id)).where(Quote.asset_id == asset_dict["id"])
            )
            if quote_count.scalar() == 0:
                assets_without_quotes.append(asset_dict)
        
        print(f"📊 Activos sin cotizaciones: {len(assets_without_quotes)}")
        
        # Limitar a 5 activos por ejecución (límite de API)
        assets_to_process = assets_without_quotes[:5]
        
        for idx, asset_dict in enumerate(assets_to_process, 1):
            print(f"\n{idx}/5 - Procesando {asset_dict['symbol']} ({asset_dict['name']})...")
            
            try:
                # Obtener cotizaciones históricas
                historical_quotes = await alpha_service.get_historical_quotes(
                    symbol=asset_dict['symbol']
                )
                
                if historical_quotes and len(historical_quotes) > 0:
                    # Insertar cotizaciones
                    quotes_added = 0
                    for quote_data in historical_quotes:
                        # Verificar si ya existe
                        existing = await session.execute(
                            select(Quote).where(
                                Quote.asset_id == asset_dict['id'],
                                Quote.date == quote_data["date"]
                            )
                        )
                        if not existing.scalar_one_or_none():
                            new_quote = Quote(
                                asset_id=asset_dict['id'],
                                date=quote_data["date"],
                                open=quote_data["open"],
                                high=quote_data["high"],
                                low=quote_data["low"],
                                close=quote_data["close"],
                                volume=quote_data["volume"],
                                source="alpha_vantage"
                            )
                            session.add(new_quote)
                            quotes_added += 1
                    
                    if quotes_added > 0:
                        await session.commit()
                        print(f"   ✅ {quotes_added} cotizaciones guardadas")
                    else:
                        print(f"   ℹ️ No hay cotizaciones nuevas")
                else:
                    print(f"   ⚠️ No se obtuvieron cotizaciones (posible error de API)")
                
            except Exception as e:
                print(f"   ❌ Error: {str(e)}")
                await session.rollback()
        
        # Mostrar resumen
        print(f"\n{'='*60}")
        print(f"✅ Proceso completado")
        print(f"📈 Activos procesados: {len(assets_to_process)}")
        print(f"⚠️ Activos restantes sin cotizaciones: {len(assets_without_quotes) - len(assets_to_process)}")
        if len(assets_without_quotes) > 5:
            print(f"💡 Ejecuta el script nuevamente para procesar los siguientes 5 activos")

if __name__ == "__main__":
    print("="*60)
    print("📥 DESCARGA DE COTIZACIONES HISTÓRICAS")
    print("="*60)
    print("🔑 API: Alpha Vantage (límite: 25 llamadas/día)")
    print("📊 Máximo por ejecución: 5 activos")
    print("="*60)
    
    asyncio.run(download_quotes_for_assets())
