"""
API de Usuarios
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin_user, hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserPreferencesUpdate

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def list_users(
    current_user: dict = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Listar todos los usuarios (solo admin)"""
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [UserResponse.model_validate(user) for user in users]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Crear nuevo usuario (solo admin)"""
    # Verificar si username ya existe
    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username ya existe"
        )
    
    # Verificar si email ya existe
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ya existe"
        )
    
    # Crear usuario
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password)
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse.model_validate(new_user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener usuario por ID"""
    # Solo admin o el mismo usuario pueden ver detalles
    if current_user["user_id"] != user_id and not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar usuario"""
    # Solo admin o el mismo usuario pueden actualizar
    if current_user["user_id"] != user_id and not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Actualizar campos
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.password is not None:
        user.hashed_password = hash_password(user_data.password)
    if user_data.base_currency is not None:
        user.base_currency = user_data.base_currency.upper()
    if user_data.is_active is not None and current_user.get("is_admin"):
        user.is_active = user_data.is_active
    if user_data.is_admin is not None and current_user.get("is_admin"):
        user.is_admin = user_data.is_admin
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.patch("/me/preferences", response_model=UserResponse)
async def update_user_preferences(
    preferences: UserPreferencesUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar preferencias del usuario autenticado"""
    user_id = current_user["user_id"]
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Actualizar moneda base (ya viene validada y en mayúsculas del schema)
    user.base_currency = preferences.base_currency
    
    await db.commit()
    await db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Eliminar usuario (solo admin)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    await db.delete(user)
    await db.commit()
