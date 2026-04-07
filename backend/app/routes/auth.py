from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.services.auth_service import register_user, login_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    return register_user(db, data)

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    token = login_user(db, data)
    return {"access_token": token}

@router.get("/me", response_model=UserOut)
def me(user=Depends(get_current_user)):
    return user