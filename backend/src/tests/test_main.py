from fastapi.testclient import TestClient
from bson import ObjectId
import pytest

from mongomock_motor import AsyncMongoMockClient

from src.main import app
from datetime import date, datetime, timezone, timedelta
from src.packages.config import Settings
from unittest.mock import AsyncMock
from src.packages.models import AuthorizationResponse, Token
import httpx


@pytest.fixture
def mock_mongo():
    return AsyncMongoMockClient()


@pytest.fixture(autouse=True)
def mock_get_settings(monkeypatch):
    # Mock the Settings class
    mock_settings = Settings(
        username="your_username",
        password="your_password",
        mongodb_uri="mongodb://localhost:27017",
        google_client_id="your_client_id",
        google_client_secret="your_client_secret",
        login_url="https://the.login.url",
        redirect_url="your_redirect_url",
        token_url="https://the.token.url",
        user_url="https://the.user.url",
    )
    monkeypatch.setattr("src.packages.config.Settings", lambda: mock_settings)


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


async def test_get_login_url_success(client):
    response = client.get("/login")

    assert response.status_code == 200
    assert (
        response.json()
        == "https://the.login.url?client_id=your_client_id&redirect_uri=your_redirect_url&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email"
    )


async def test_authorise_success(client, mock_mongo, monkeypatch):
    async def mock_post(url, params):
        return httpx.Response(
            status_code=200,
            json={
                "access_token": "mocked_access_token",
                "scope": "mocked_scope",
                "expires_in": 3600,
                "id_token": "mocked_id_token",
            },
        )

    mock_user_response = httpx.Response(status_code=200, json={"sub": "mocked_user_id"})

    mock_async_client = AsyncMock(spec=httpx.AsyncClient)
    mock_async_client.post = AsyncMock(side_effect=mock_post)
    mock_async_client.get = AsyncMock(return_value=mock_user_response)

    mock_async_client.__aenter__.return_value = mock_async_client

    monkeypatch.setattr("src.main.AsyncClient", lambda: mock_async_client)

    body = AuthorizationResponse(code="mocked_auth_code")

    response = client.post("/authorise", json=body.model_dump())

    assert response.status_code == 200
    assert response.json()["access_token"] == "mocked_access_token"
    assert "session_id" in response.json()

    session_count = await mock_mongo.db["sessions"].count_documents({})
    assert session_count == 1

    user_count = await mock_mongo.db["users"].count_documents({})
    assert user_count == 1


async def test_create_plant_success(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    plant_data = {"name": "apple", "category": "fruit"}
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": "mock_user_id",
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }

    await mock_mongo.db["sessions"].insert_one(session_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.post("/create-plant", json=plant_data, headers=headers)

    assert response.status_code == 201

    plant_id = response.json()["_id"]
    assert response.json() == {"_id": plant_id, "name": "apple", "category": "fruit"}


async def test_create_plant_success_name_subset_of_existing_plant(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": "mock_user_id",
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_data = {
        "_id": "64e10a1b9d708654778a1337",
        "name": "sweet potato",
        "category": "vegetable",
    }
    await mock_mongo.db["plants"].insert_one(plant_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.post(
        "/create-plant",
        json={"name": "potato", "category": "vegetable"},
        headers=headers,
    )

    assert response.status_code == 201

    plant_id = response.json()["_id"]
    assert response.json() == {
        "_id": plant_id,
        "name": "potato",
        "category": "vegetable",
    }


async def test_create_plant_already_exists(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": "mock_user_id",
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_data = {
        "_id": "64e10a1b9d708654778a1337",
        "name": "apple",
        "category": "fruit",
    }
    await mock_mongo.db["plants"].insert_one(plant_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.post(
        "/create-plant", json={"name": "apple", "category": "fruit"}, headers=headers
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "Plant already exists"}


async def test_delete_plant_success(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock-user-id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_id = "67bdca3d86bc1187fad97937"
    todays_date = date.today().strftime("%d-%m-%Y")

    await mock_mongo.db["users"].insert_one(
        {
            "_id": mock_user_id,
            "plants": {todays_date: {plant_id: {"name": "test_plant"}}},
        }
    )

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.delete(
        f"/user/delete-plant/{plant_id}?when=today", headers=headers
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Plant successfully deleted"}


async def test_delete_plant_plant_not_found(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock-user-id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_id = "67bdca3d86bc1187fad97937"
    todays_date = date.today().strftime("%d-%m-%Y")

    await mock_mongo.db["users"].insert_one(
        {"_id": mock_user_id, "plants": {todays_date: {}}}
    )

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.delete(f"/user/delete-plant/{plant_id}", headers=headers)

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Plant not found in user's collection for the specified date"
    }


async def test_delete_plant_user_not_found(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock-user-id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_id = "67bdca3d86bc1187fad97937"

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.delete(f"/user/delete-plant/{plant_id}", headers=headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}


async def test_search_all_plants_success(client, mock_mongo):
    plant_data = {"name": "apple", "category": "fruit"}
    await mock_mongo.db["plants"].insert_one(plant_data)

    response = client.get("/plants/search?q=ap")
    plant_id = response.json()[0]["_id"]

    assert response.status_code == 200
    assert response.json() == [{"_id": plant_id, "name": "apple", "category": "fruit"}]

    response = client.get("/plants/search?q=banana")
    assert response.status_code == 200
    assert response.json() == []


async def test_add_plant_success(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock-user-id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_id = "67bdca3d86bc1187fad97937"
    plant_data = {"_id": ObjectId(plant_id), "name": "apple", "category": "fruit"}

    await mock_mongo.db["plants"].insert_one(plant_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.post(f"/user/add-plant/{plant_id}", headers=headers)

    assert response.status_code == 200
    assert response.json() == {"id": plant_id, "name": "apple", "category": "fruit"}


async def test_add_plant_first_plant_of_day(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock-user-id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_id = "67bdca3d86bc1187fad97937"
    plant_data = {"_id": ObjectId(plant_id), "name": "apple", "category": "fruit"}
    yesterday_date = (date.today() - timedelta(days=1)).strftime("%d-%m-%Y")
    user_plant_data = {
        "_id": mock_user_id,
        "plants": {yesterday_date: {plant_id: {"name": "apple", "category": "fruit"}}},
    }
    await mock_mongo.db["plants"].insert_one(plant_data)
    await mock_mongo.db["users"].insert_one(user_plant_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.post(f"/user/add-plant/{plant_id}", headers=headers)

    assert response.status_code == 200
    assert response.json() == {"id": plant_id, "name": "apple", "category": "fruit"}


async def test_add_plant_not_found(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock-user-id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    invalid_id = "000000000000000000000000"

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.post(f"/user/add-plant/{invalid_id}", headers=headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "Plant not found"}


async def test_add_plant_duplicate(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock-user-id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_id = "67bdca3d86bc1187fad97937"
    plant_data = {"_id": ObjectId(plant_id), "name": "apple", "category": "fruit"}

    await mock_mongo.db["plants"].insert_one(plant_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    client.post(f"/user/add-plant/{plant_id}", headers=headers)

    response = client.post(f"/user/add-plant/{plant_id}", headers=headers)

    assert response.status_code == 400
    assert response.json() == {"detail": "Plant already exists in user's collection"}


async def test_get_plants_today_success(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock-user-id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    todays_date = date.today().strftime("%d-%m-%Y")
    plant_data = {
        "_id": mock_user_id,
        "plants": {
            todays_date: {"plant1": {"name": "apple"}, "plant2": {"name": "pear"}}
        },
    }
    await mock_mongo.db["users"].insert_one(plant_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.get("/user/plants", headers=headers)

    assert response.status_code == 200
    assert response.json() == [
        {"_id": "plant1", "name": "apple"},
        {"_id": "plant2", "name": "pear"},
    ]


async def test_get_plants_empty(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock-user-id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_data = {"_id": mock_user_id, "plants": {}}
    await mock_mongo.db["users"].insert_one(plant_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.get("/user/plants", headers=headers)

    assert response.status_code == 200
    assert response.json() == []


async def test_get_week_plants_today_success(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock-user-id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    todays_date = date.today().strftime("%d-%m-%Y")
    yesterdays_date = (date.today() - timedelta(days=1)).strftime("%d-%m-%Y")
    plant_data = {
        "_id": mock_user_id,
        "plants": {
            todays_date: {"plant1": {"name": "apple"}, "plant2": {"name": "pear"}},
            yesterdays_date: {
                "plant1": {"name": "apple"},
                "plant3": {"name": "carrot"},
            },
        },
    }
    await mock_mongo.db["users"].insert_one(plant_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.get("/user/week-plants", headers=headers)

    assert response.status_code == 200
    assert response.json() == [
        {"_id": "plant1", "name": "apple"},
        {"_id": "plant2", "name": "pear"},
        {"_id": "plant3", "name": "carrot"},
    ]


async def test_get_current_user_invalid_scheme(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock_user_id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_data = {"_id": mock_user_id, "plants": {}}
    await mock_mongo.db["users"].insert_one(plant_data)

    invalid_scheme = "bearer"

    headers = {
        "Authorization": f"{invalid_scheme} mocked_access_token:{mock_session_id}"
    }
    response = client.get("/user/plants", headers=headers)

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication scheme"}


async def test_get_current_user_missing_credentials(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock_user_id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) + timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_data = {"_id": mock_user_id, "plants": {}}
    await mock_mongo.db["users"].insert_one(plant_data)

    missing_credentials = "null"

    headers = {"Authorization": f"Bearer {missing_credentials}"}
    response = client.get("/user/plants", headers=headers)

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication credentials"}


async def test_get_current_user_session_not_found(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock_user_id"

    plant_data = {"_id": mock_user_id, "plants": {}}
    await mock_mongo.db["users"].insert_one(plant_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.get("/user/plants", headers=headers)

    assert response.status_code == 401
    assert response.json() == {"detail": "Session not found"}


async def test_get_current_user_session_expired(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock_user_id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) - timedelta(seconds=300),
    }
    await mock_mongo.db["sessions"].insert_one(session_data)

    plant_data = {"_id": mock_user_id, "plants": {}}
    await mock_mongo.db["users"].insert_one(plant_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.get("/user/plants", headers=headers)

    assert response.status_code == 401
    assert response.json() == {"detail": "Session expired"}


async def test_logout_success(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"
    mock_user_id = "mock_user_id"
    session_data = {
        "_id": ObjectId(mock_session_id),
        "user_id": mock_user_id,
        "expires_in": datetime.now(timezone.utc) - timedelta(seconds=300),
    }

    await mock_mongo.db["sessions"].insert_one(session_data)

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.delete("/user/logout", headers=headers)

    assert response.status_code == 200
    assert response.json() == {"message": "User successfully logged out"}


async def test_logout_session_not_found(client, mock_mongo):
    mock_session_id = "67f509cbae80c09eb2b3f83d"

    headers = {"Authorization": f"Bearer mocked_access_token:{mock_session_id}"}
    response = client.delete("/user/logout", headers=headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"}
