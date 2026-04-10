from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.expense import ExpenseCreate, ExpenseOut
from app.services.expense_service import create_expense, get_expenses

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/expenses", response_model=ExpenseOut)
def add_expense(expense: ExpenseCreate, db: Session = Depends(get_db), idempotency_key: str = Header(default=None)):
    return create_expense(db, expense, idempotency_key)

@router.get("/expenses", response_model=list[ExpenseOut])
def list_expenses(category: str = None, sort: str = None, db: Session = Depends(get_db)):
    return get_expenses(db, category, sort)
