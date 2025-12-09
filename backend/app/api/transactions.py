"""
API de Transacciones
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.portfolio import Portfolio
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse

router = APIRouter()


@router.get("/portfolio/{portfolio_id}", response_model=List[TransactionResponse])
async def list_transactions(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Listar transacciones de una cartera"""
    # Verificar que la cartera pertenece al usuario
    portfolio_result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        )
    )
    if not portfolio_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cartera no encontrada"
        )
    
    result = await db.execute(
        select(Transaction)
        .where(Transaction.portfolio_id == portfolio_id)
        .order_by(Transaction.transaction_date.desc())
    )
    transactions = result.scalars().all()
    return [TransactionResponse.model_validate(t) for t in transactions]


@router.post("/portfolio/{portfolio_id}", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    portfolio_id: str,
    transaction_data: TransactionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Crear nueva transacción"""
    # Verificar que la cartera pertenece al usuario
    portfolio_result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        )
    )
    if not portfolio_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cartera no encontrada"
        )
    
    new_transaction = Transaction(
        portfolio_id=portfolio_id,
        asset_id=transaction_data.asset_id,
        transaction_type=transaction_data.transaction_type,
        transaction_date=transaction_data.transaction_date,
        quantity=transaction_data.quantity,
        price=transaction_data.price,
        fees=transaction_data.fees,
        notes=transaction_data.notes
    )
    
    db.add(new_transaction)
    await db.commit()
    await db.refresh(new_transaction)
    
    return TransactionResponse.model_validate(new_transaction)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener transacción por ID"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transacción no encontrada"
        )
    
    # Verificar que la cartera pertenece al usuario
    portfolio_result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == transaction.portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        )
    )
    if not portfolio_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado"
        )
    
    return TransactionResponse.model_validate(transaction)


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    transaction_data: TransactionUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar transacción"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transacción no encontrada"
        )
    
    # Verificar que la cartera pertenece al usuario
    portfolio_result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == transaction.portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        )
    )
    if not portfolio_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado"
        )
    
    # Actualizar campos
    if transaction_data.transaction_type is not None:
        transaction.transaction_type = transaction_data.transaction_type
    if transaction_data.transaction_date is not None:
        transaction.transaction_date = transaction_data.transaction_date
    if transaction_data.quantity is not None:
        transaction.quantity = transaction_data.quantity
    if transaction_data.price is not None:
        transaction.price = transaction_data.price
    if transaction_data.fees is not None:
        transaction.fees = transaction_data.fees
    if transaction_data.notes is not None:
        transaction.notes = transaction_data.notes
    
    await db.commit()
    await db.refresh(transaction)
    
    return TransactionResponse.model_validate(transaction)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Eliminar transacción"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transacción no encontrada"
        )
    
    # Verificar que la cartera pertenece al usuario
    portfolio_result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == transaction.portfolio_id,
            Portfolio.user_id == current_user["user_id"]
        )
    )
    if not portfolio_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado"
        )
    
    await db.delete(transaction)
    await db.commit()
