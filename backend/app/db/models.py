from sqlalchemy import Column, String, Float, DateTime
from datetime import datetime
import uuid
from app.db.session import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String)
    date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    idempotency_key = Column(String, unique=True, nullable=True)
