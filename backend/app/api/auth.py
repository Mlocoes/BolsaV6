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
    # Buscar usuario
    result = await db.execute(
        select(User).where(User.username == credentials.username)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Crear sesión en Redis
    session_id = await session_manager.create_session(
        user_id=str(user.id),
        user_data={
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin
        }
    )
    
    # Establecer cookie HttpOnly
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=False,  # Forzar False en desarrollo
        samesite="lax",
        max_age=settings.SESSION_EXPIRE_MINUTES * 60,
        domain=None  # Sin restricción de dominio
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
    # Obtener session_id de la cookie (ya validada por get_current_user)
    # Necesitamos acceder directamente a la cookie para obtener el ID
    from fastapi import Request
    
    @router.post("/logout")
    async def logout_inner(
        request: Request,
        response: Response,
        current_user: dict = Depends(get_current_user)
    ):
        session_id = request.cookies.get("session_id")
        
        if session_id:
            await session_manager.delete_session(session_id)
        
        # Eliminar cookie
        response.delete_cookie(key="session_id")
        
        return {"message": "Logout exitoso"}
    
    return await logout_inner(response, current_user)


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
