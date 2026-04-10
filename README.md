# Expense Tracker Pro

A full-stack personal finance tool for recording and reviewing expenses with production-like quality.

## Features

### Backend (FastAPI + SQLite)
- RESTful API with POST /expenses and GET /expenses endpoints
- Idempotency key support to handle network retries and page refreshes
- Category filtering and date-based sorting
- Input validation (positive amounts, required fields)
- SQLite database for persistence
- Automated tests covering core functionality

### Frontend (Vanilla HTML/JS)
- Form to add new expenses with validation
- Table view of expenses with proper formatting
- Category filter dropdown (populated dynamically)
- Sort by date (newest/oldest first)
- Total amount display for visible expenses
- Summary by category (total per category)
- Error handling with user-friendly messages
- Loading states during API calls
- localStorage persistence for form data (handles page refreshes)
- XSS protection with HTML escaping

## Design Decisions

### Persistence Choice: SQLite
**Why SQLite?**
- Zero configuration - no separate database server needed
- Single file storage - easy to backup and migrate
- Sufficient for personal finance scale (thousands of records)
- ACID compliant for data integrity
- Fast for read-heavy workloads

**Trade-offs:**
- Not suitable for high-concurrency multi-user scenarios
- Limited write performance compared to PostgreSQL/MySQL
- For this assignment's scope (single user, personal finance), these trade-offs are acceptable

### Money Handling: Float Type
**Decision:** Used `Float` in SQLAlchemy and `float` in Pydantic for amount field.

**Trade-offs:**
- Floating-point arithmetic can have precision issues (e.g., 0.1 + 0.2 ≠ 0.3)
- For a production system handling real money, Decimal type would be better
- Kept it simple for this assignment given the timebox constraint
- Frontend displays with `.toFixed(2)` for consistent formatting

### Idempotency Implementation
**Approach:** Idempotency-Key header stored as unique column in database.

**Design:**
- Client generates key from form data: `{amount}-{category}-{date}-{description}`
- Backend checks for existing expense with same key before creating new one
- Returns existing expense if found, preventing duplicates from retries

**Trade-offs:**
- Simple and effective for this use case
- Could be improved with expiration time for idempotency keys
- For production, might want UUID-based keys with TTL

### Frontend Technology: Vanilla JS
**Decision:** No framework (React, Vue, etc.) - used vanilla HTML/JS.

**Why:**
- Minimal dependencies and build complexity
- Fast load times
- Sufficient for this feature set
- Easier to understand and maintain for a small codebase

**Trade-offs:**
- Less structured than framework-based code
- Manual DOM manipulation
- For a larger application, a framework would provide better scalability

### Error Handling Strategy
**Implementation:**
- Try-catch blocks around all API calls
- User-friendly error messages displayed for 5 seconds
- Loading states prevent duplicate submissions during API calls
- Form validation before API calls to catch obvious errors early

### localStorage for Form Data
**Purpose:** Preserve user input across page refreshes.

**Implementation:**
- Save form data on every input change
- Load saved data on page load
- Clear localStorage only on successful submission

**Trade-offs:**
- Adds complexity but significantly improves UX
- Data is lost if user clears browser cache
- Alternative: Could use sessionStorage (clears on tab close)

## What Was Not Done (Trade-offs due to Timebox)

1. **Decimal precision for money:** Would implement Decimal type for production-grade financial accuracy
2. **Idempotency key expiration:** Would add TTL to prevent unbounded growth of idempotency keys
3. **Authentication/Authorization:** Not needed for single-user personal tool, but would add for multi-user scenarios
4. **Pagination:** Not implemented due to expected small dataset size
5. **Advanced filtering:** Only category filter implemented; could add date range, amount range, etc.
6. **Export functionality:** Could add CSV/PDF export of expense data
7. **Edit/Delete operations:** Not required by assignment, but useful for real-world use
8. **Frontend framework testing:** No automated frontend tests due to time constraint
9. **CI/CD pipeline:** Would add GitHub Actions for automated testing and deployment
10. **Database migrations:** Would use Alembic for schema versioning in production

## Running the Application

### Using Docker (Recommended)
```bash
docker-compose up --build
```
Access the application at http://localhost:8000

### Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
Simply open `frontend/index.html` in a browser, or serve via any static file server.

Note: If running manually, update the API URL in `frontend/app.js` from `http://localhost:8000/api/expenses` to match your backend address.

## Running Tests

```bash
cd backend
pytest
```

Tests cover:
- Expense creation
- Input validation
- Idempotency handling
- Category filtering
- Date sorting

## API Endpoints

### POST /api/expenses
Create a new expense.

**Request Body:**
```json
{
  "amount": 100.50,
  "category": "food",
  "description": "Lunch",
  "date": "2024-01-15"
}
```

**Headers (Optional but Recommended):**
- `Idempotency-Key`: Unique string to handle retries

**Response:**
```json
{
  "id": "uuid",
  "amount": 100.5,
  "category": "food",
  "description": "Lunch",
  "date": "2024-01-15T00:00:00",
  "created_at": "2024-01-15T10:30:00"
}
```

### GET /api/expenses
Get list of expenses with optional filtering and sorting.

**Query Parameters:**
- `category` (optional): Filter by category
- `sort` (optional): Sort order - `date_desc` (newest first) or `date_asc` (oldest first)

**Examples:**
- `/api/expenses` - Get all expenses
- `/api/expenses?category=food` - Get only food expenses
- `/api/expenses?sort=date_desc` - Get expenses sorted by date (newest first)
- `/api/expenses?category=food&sort=date_desc` - Combined filter and sort
