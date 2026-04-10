from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal, Base, engine
from app.db.models import Expense

client = TestClient(app)

def setup_function():
    # Create tables before each test
    Base.metadata.create_all(bind=engine)

def teardown_function():
    # Drop tables after each test
    Base.metadata.drop_all(bind=engine)

def test_create_expense():
    response = client.post("/api/expenses", json={
        "amount": 100,
        "category": "food",
        "description": "test",
        "date": "2024-01-01T00:00:00"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 100
    assert data["category"] == "food"
    assert data["description"] == "test"
    assert "id" in data
    assert "created_at" in data

def test_create_expense_with_validation():
    # Test negative amount
    response = client.post("/api/expenses", json={
        "amount": -50,
        "category": "food",
        "description": "test",
        "date": "2024-01-01T00:00:00"
    })
    assert response.status_code == 422

def test_idempotency_key():
    # Create expense with idempotency key
    idempotency_key = "test-key-123"
    response1 = client.post(
        "/api/expenses",
        json={
            "amount": 100,
            "category": "food",
            "description": "test",
            "date": "2024-01-01T00:00:00"
        },
        headers={"Idempotency-Key": idempotency_key}
    )
    assert response1.status_code == 200
    expense1_id = response1.json()["id"]

    # Retry with same idempotency key should return same expense
    response2 = client.post(
        "/api/expenses",
        json={
            "amount": 100,
            "category": "food",
            "description": "test",
            "date": "2024-01-01T00:00:00"
        },
        headers={"Idempotency-Key": idempotency_key}
    )
    assert response2.status_code == 200
    expense2_id = response2.json()["id"]
    assert expense1_id == expense2_id

def test_get_expenses():
    # Create multiple expenses
    client.post("/api/expenses", json={
        "amount": 100,
        "category": "food",
        "description": "lunch",
        "date": "2024-01-02T00:00:00"
    })
    client.post("/api/expenses", json={
        "amount": 50,
        "category": "transport",
        "description": "bus",
        "date": "2024-01-01T00:00:00"
    })

    response = client.get("/api/expenses")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

def test_filter_by_category():
    # Create expenses with different categories
    client.post("/api/expenses", json={
        "amount": 100,
        "category": "food",
        "description": "lunch",
        "date": "2024-01-02T00:00:00"
    })
    client.post("/api/expenses", json={
        "amount": 50,
        "category": "transport",
        "description": "bus",
        "date": "2024-01-01T00:00:00"
    })

    response = client.get("/api/expenses?category=food")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["category"] == "food"

def test_sort_by_date_desc():
    # Create expenses with different dates
    client.post("/api/expenses", json={
        "amount": 100,
        "category": "food",
        "description": "lunch",
        "date": "2024-01-01T00:00:00"
    })
    client.post("/api/expenses", json={
        "amount": 50,
        "category": "transport",
        "description": "bus",
        "date": "2024-01-02T00:00:00"
    })

    response = client.get("/api/expenses?sort=date_desc")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Newest first (2024-01-02 should be first)
    assert data[0]["date"] == "2024-01-02T00:00:00"
    assert data[1]["date"] == "2024-01-01T00:00:00"
