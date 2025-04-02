from fastapi.testclient import TestClient
from bson import ObjectId
import pytest

from mongomock_motor import AsyncMongoMockClient

from src.packages import mongodb
from src.main import app
from datetime import date, timedelta


@pytest.fixture
def mock_mongo():
    return AsyncMongoMockClient()


@pytest.fixture
def client(mock_mongo, monkeypatch):
    async def mock_startup_db_client(app):
        print("Mocked startup_db_client called - skipping database connection")

    # Patch startup_db_client to prevent the actual database connection
    monkeypatch.setattr(
        "src.packages.mongodb.startup_db_client", mock_startup_db_client
    )

    app.mongodb_client = mock_mongo
    app.mongodb = mock_mongo.get_database("db")
    with TestClient(app) as client:
        yield client


async def test_create_plant(client):
    plant_data = {"name": "apple", "category": "fruit"}
    response = client.post("/create-plant", json=plant_data)

    id = response.json()["_id"]

    assert response.status_code == 201
    assert response.json() == {"_id": id, "name": "apple", "category": "fruit"}


async def test_create_plant_already_exists(client, mock_mongo):
    plant_data = {
        "_id": "64e10a1b9d708654778a1337",
        "name": "apple",
        "category": "fruit",
    }
    await mock_mongo.db["plants"].insert_one(plant_data)

    response = client.post("/create-plant", json={"name": "apple", "category": "fruit"})

    assert response.status_code == 409
    assert response.json() == {"detail": "Plant already exists"}


async def test_search_all_plants(client, mock_mongo):
    plant_data = {"name": "apple", "category": "fruit"}
    await mock_mongo.db["plants"].insert_one(plant_data)

    response = client.get("/plants/search?q=ap")
    plant_id = response.json()[0]["_id"]

    assert response.status_code == 200
    assert response.json() == [{"_id": plant_id, "name": "apple", "category": "fruit"}]

    response = client.get("/plants/search?q=banana")
    assert response.status_code == 200
    assert response.json() == []


async def test_add_plant(client, mock_mongo):
    user_id = "67bc93477fcac69fbfe17d44"
    plant_id = "67bdca3d86bc1187fad97937"
    plant_data = {"_id": ObjectId(plant_id), "name": "apple", "category": "fruit"}

    await mock_mongo.db["plants"].insert_one(plant_data)

    response = client.post(f"/user/{user_id}/add-plant/{plant_id}")

    assert response.status_code == 200
    assert response.json() == {"id": plant_id, "name": "apple", "category": "fruit"}


async def test_add_plant_first_plant_of_day(client, mock_mongo):
    user_id = "67bc93477fcac69fbfe17d44"
    plant_id = "67bdca3d86bc1187fad97937"
    plant_data = {"_id": ObjectId(plant_id), "name": "apple", "category": "fruit"}
    yesterday_date = (date.today() - timedelta(days=1)).strftime("%d-%m-%Y")
    user_plant_data = {
        "_id": ObjectId(user_id),
        "plants": {yesterday_date: {plant_id: {"name": "apple", "category": "fruit"}}},
    }
    await mock_mongo.db["plants"].insert_one(plant_data)
    await mock_mongo.db["users"].insert_one(user_plant_data)

    response = client.post(f"/user/{user_id}/add-plant/{plant_id}")

    assert response.status_code == 200
    assert response.json() == {"id": plant_id, "name": "apple", "category": "fruit"}


async def test_add_plant_not_found(client):
    user_id = "67bc93477fcac69fbfe17d44"
    invalid_id = "000000000000000000000000"
    response = client.post(f"/user/{user_id}/add-plant/{invalid_id}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Plant not found"}


async def test_add_plant_duplicate(client, mock_mongo):
    user_id = "67bc93477fcac69fbfe17d44"
    plant_id = "67bdca3d86bc1187fad97937"
    plant_data = {"_id": ObjectId(plant_id), "name": "apple", "category": "fruit"}

    await mock_mongo.db["plants"].insert_one(plant_data)

    client.post(f"/user/{user_id}/add-plant/{plant_id}")

    response = client.post(f"/user/{user_id}/add-plant/{plant_id}")

    assert response.status_code == 400
    assert response.json() == {"detail": "Plant already exists in user's collection"}


async def test_get_plants_today(client, mock_mongo):
    user_id = "67bc93477fcac69fbfe17d44"
    todays_date = date.today().strftime("%d-%m-%Y")
    plant_data = {
        "_id": ObjectId(user_id),
        "plants": {
            todays_date: {"plant1": {"name": "apple"}, "plant2": {"name": "pear"}}
        },
    }
    await mock_mongo.db["users"].insert_one(plant_data)

    response = client.get(f"/user/{user_id}/plants")

    assert response.status_code == 200
    assert response.json() == [
        {"id": "plant1", "name": "apple"},
        {"id": "plant2", "name": "pear"},
    ]


async def test_get_plants_empty(client, mock_mongo):
    user_id = "67bc93477fcac69fbfe17d44"
    plant_data = {"_id": ObjectId(user_id), "plants": {}}
    await mock_mongo.db["users"].insert_one(plant_data)

    response = client.get(f"/user/{user_id}/plants")

    assert response.status_code == 200
    assert response.json() == []
