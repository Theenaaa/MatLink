from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "CANONIX Platform API" in data["message"]


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["app"] == "CANONIX"
    assert "matching_weights" in data
    assert data["matching_weights"]["semantic"] == 0.40
    assert data["matching_weights"]["attribute"] == 0.30
    assert data["matching_weights"]["rule"] == 0.20
    assert data["matching_weights"]["classification"] == 0.10
