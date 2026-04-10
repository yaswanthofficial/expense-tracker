from pydantic import BaseModel, Field
from datetime import datetime

class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0)
    category: str
    description: str | None = None
    date: datetime

class ExpenseOut(ExpenseCreate):
    id: str
    created_at: datetime
