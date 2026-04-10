from sqlalchemy.orm import Session
from app.db.models import Expense

def create_expense(db: Session, data, idempotency_key):
    if idempotency_key:
        existing = db.query(Expense).filter_by(idempotency_key=idempotency_key).first()
        if existing:
            return existing

    expense = Expense(**data.dict(), idempotency_key=idempotency_key)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

def get_expenses(db: Session, category=None, sort=None):
    query = db.query(Expense)

    if category:
        query = query.filter(Expense.category == category)

    if sort == "date_desc":
        query = query.order_by(Expense.date.desc())

    return query.all()
