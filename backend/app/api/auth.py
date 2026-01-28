"""
API de Autenticación
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password, get_current_user
from app.core.session import session_manager
from app.models.user import User
from app.schemas.user import LoginRequest, LoginResponse, UserResponse
from app.core.config import settings

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Login de usuario
    
    Crea una sesión efímera en Redis y establece cookie HttpOnly
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"🔐 Intento de login para usuario: {credentials.username}")
    
    # Buscar usuario
    try:
        result = await db.execute(
            select(User).where(User.username == credentials.username)
        )
        user = result.scalar_one_or_none()
        logger.debug(f"👤 Usuario encontrado: {user is not None}")
    except Exception as e:
        logger.error(f"❌ Error buscando usuario: {str(e)}")
        raise e
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        logger.warning(f"⚠️ Credenciales inválidas para: {credentials.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    if not user.is_active:
        logger.warning(f"⚠️ Usuario inactivo: {credentials.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Crear sesión en Redis
    logger.info(f"🎫 Creando sesión para {user.username}...")
    try:
        session_id = await session_manager.create_session(
            user_id=str(user.id),
            user_data={
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_admin,
                "base_currency": user.base_currency
            }
        )
        logger.info(f"✅ Sesión creada: {session_id[:8]}...")
    except Exception as e:
        logger.error(f"❌ Error creando sesión: {str(e)}")
        raise e
    
    # Establecer cookie HttpOnly
    # secure=True en producción (HTTPS), False en desarrollo
    # samesite=lax para protección CSRF básica
    is_production = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=is_production or settings.SECURE_COOKIES,
        samesite="strict" if is_production else "lax",
        max_age=settings.SESSION_EXPIRE_MINUTES * 60,
        # No especificar domain permite usar cualquier IP/hostname
    )
    
    return LoginResponse(
        user=UserResponse.model_validate(user)
    )


@router.post("/logout")
async def logout(
    response: Response,
    current_user: dict = Depends(get_current_user)
):
    """
    Logout de usuario
    
    Elimina la sesión de Redis y la cookie
    """
    # El current_user ya contiene el session_id si lo sacamos del get_current_user
    # O podemos obtenerlo directamente si extendemos el get_current_user
    # Para este caso, vamos a usar el session_id si está guardado en el current_user 
    # o simplemente limpiar la cookie.
    
    # Nota: Si el usuario está aquí, es porque get_current_user validó la sesión.
    # Necesitamos el ID exacto para borrarlo de Redis.
    
    session_id = current_user.get("session_id")
    if session_id:
        await session_manager.delete_session(session_id)
    
    # Eliminar cookie (debe coincidir con los parámetros del set_cookie)
    response.delete_cookie(
        key="session_id",
        httponly=True,
        secure=False,
        samesite="none" if settings.ENVIRONMENT == "development" else "lax"
    )
    
    return {"message": "Logout exitoso"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtener usuario actual
    """
    result = await db.execute(
        select(User).where(User.id == current_user["user_id"])
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return UserResponse.model_validate(user)
