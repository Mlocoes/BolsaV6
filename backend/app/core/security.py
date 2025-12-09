"""
Utilidades de seguridad
"""
import bcrypt
from fastapi import HTTPException, status, Cookie, Depends
from typing import Optional
from app.core.session import session_manager


def hash_password(password: str) -> str:
    """Hash de contraseña con bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


async def get_current_user(session_id: Optional[str] = Cookie(None, alias="session_id")):
    """
    Dependency para obtener usuario actual desde sesión
    
    Args:
        session_id: ID de sesión desde cookie
    
    Returns:
        Datos del usuario
    
    Raises:
        HTTPException: Si no hay sesión válida
    """
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado"
        )
    
    session_data = await session_manager.get_session(session_id)
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión inválida o expirada"
        )
    
    # Renovar sesión en cada request
    await session_manager.refresh_session(session_id)
    
    return session_data


async def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    """
    Dependency para verificar que el usuario es admin
    
    Args:
        current_user: Usuario actual
    
    Returns:
        Datos del usuario admin
    
    Raises:
        HTTPException: Si el usuario no es admin
    """
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permisos insuficientes"
        )
    
    return current_user
