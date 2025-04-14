from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from datetime import date, datetime, timezone, timedelta

from fastapi.security import HTTPBearer
from src.packages.config import get_settings
from src.packages.config import logger
from src.packages.mongodb import lifespan
from src.packages.models import AuthorizationResponse, Token, Plant
from urllib.parse import urlencode
from httpx import AsyncClient

app = FastAPI(lifespan=lifespan)

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


def get_current_session(credentials: str = Depends(security)):
    if credentials.scheme != "Bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
        )

    if credentials.credentials == "null" or credentials.credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    access_token, session_id = credentials.credentials.split(":")
    if not access_token or not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing credentials",
        )

    return session_id


async def get_current_user(session_id: str = Depends(get_current_session)):

    session = await app.mongodb["sessions"].find_one({"_id": ObjectId(session_id)})

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session not found",
        )

    if session["expires_in"].replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
        )

    return session["user_id"]


@app.get("/login")
def get_login_url():
    params = {
        "client_id": get_settings().google_client_id,
        "redirect_uri": get_settings().redirect_url,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/userinfo.email",
    }
    return f"{get_settings().login_url}?{urlencode(params)}"


@app.post("/authorise")
async def verify_authorisation(body: AuthorizationResponse, response: Response):

    params = {
        "client_id": get_settings().google_client_id,
        "client_secret": get_settings().google_client_secret,
        "code": body.code,
        "grant_type": "authorization_code",
        "redirect_uri": get_settings().redirect_url,
    }

    async with AsyncClient() as client:
        authenticate_user = await client.post(get_settings().token_url, params=params)

        if authenticate_user.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get access token",
            )

        access_token = authenticate_user.json().get("access_token")
        user = await client.get(
            f"{get_settings().user_url}?access_token={access_token}"
        )
        user_id = user.json().get("sub").encode("utf-8").hex()

        user_session = {
            "user_id": user_id,
            "access_token": access_token,
            "scope": authenticate_user.json().get("scope"),
            "expires_in": datetime.now(timezone.utc)
            + timedelta(seconds=authenticate_user.json().get("expires_in")),
            "created_at": datetime.now(timezone.utc),
            "id_token": authenticate_user.json().get("id_token"),
        }
        session = await app.mongodb["sessions"].insert_one(user_session)
        session_id = str(session.inserted_id)

        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=True,
            samesite="None",
        )

        user_plants = await app.mongodb["users"].find_one({"_id": user_id})
        if user_plants is None:
            user_plants = {"_id": user_id, "plants": {}}
            await app.mongodb["users"].insert_one(user_plants)

    return Token(access_token=access_token, session_id=session_id)


@app.post("/create-plant", response_model=Plant, status_code=201)
async def create_plant(plant: Plant, user_id: str = Depends(get_current_user)):
    is_plant_in_db = await app.mongodb["plants"].count_documents(
        {"name": {"$regex": rf"^{plant.name}$", "$options": "i"}}
    )

    if is_plant_in_db > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Plant already exists"
        )

    new_plant = await app.mongodb["plants"].insert_one(
        plant.model_dump(by_alias=True, exclude=["id"])
    )
    created_plant = await app.mongodb["plants"].find_one({"_id": new_plant.inserted_id})

    return Plant(**created_plant)


@app.delete("/user/delete-plant/{plant_id}")
async def delete_plant(
    plant_id: str, when: str = "today", user_id: str = Depends(get_current_user)
):
    todays_date = date.today().strftime("%d-%m-%Y")

    if when == "today":
        plant_key = f"plants.{todays_date}.{plant_id}"

    result = await app.mongodb["users"].update_one(
        {"_id": user_id}, {"$unset": {plant_key: ""}}
    )

    if result.modified_count == 1:
        return {"message": "Plant successfully deleted"}
    elif result.matched_count == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plant not found in user's collection for the specified date",
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )


@app.get("/plants/search")
async def search_all_plants(q: str):
    plants = (
        await app.mongodb["plants"]
        .find(
            {
                "$or": [
                    {"name": {"$regex": q, "$options": "i"}},
                    {"category": {"$regex": q, "$options": "i"}},
                ]
            }
        )
        .to_list(10)
    )

    for plant in plants:
        plant["_id"] = str(plant["_id"])

    return jsonable_encoder(plants)


@app.post("/user/add-plant/{plant_id}")
async def add_plant(plant_id: str, user_id: str = Depends(get_current_user)):
    plant_to_add = await app.mongodb["plants"].find_one(
        {"_id": ObjectId(plant_id)}, {"_id": 0}
    )

    if plant_to_add is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found"
        )

    todays_date = date.today().strftime("%d-%m-%Y")
    plant_key = f"plants.{todays_date}.{plant_id}"

    is_plant_in_db = await app.mongodb["users"].find_one({"_id": user_id}, {"_id": 0})

    if (
        (is_plant_in_db is not None)
        and (todays_date in is_plant_in_db["plants"])
        and (plant_id in is_plant_in_db["plants"][todays_date])
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plant already exists in user's collection",
        )

    await app.mongodb["users"].update_one(
        {"_id": user_id},
        {"$set": {plant_key: plant_to_add}},
        upsert=True,
    )

    return {"id": plant_id, **plant_to_add}


@app.get("/user/day-plants")
async def get_daily_plants(
    when: str = "today", user_id: str = Depends(get_current_user)
):

    if when == "today":
        the_date = date.today().strftime("%d-%m-%Y")
        plant_key = "plants.%s" % the_date
    elif when == "yesterday":
        the_date = (date.today() - timedelta(days=1)).strftime("%d-%m-%Y")
        plant_key = "plants.%s" % the_date

    list_of_plants = await app.mongodb["users"].find_one(
        {"_id": user_id}, {"_id": 0, plant_key: 1}
    )

    if the_date in list_of_plants["plants"]:
        plants_list = []
        for key, value in list_of_plants["plants"][the_date].items():
            plants_list.append({"_id": key, **value})
        return plants_list
    else:
        return []


@app.get("/user/week-plants")
async def get_weekly_plants(
    when: str = "today", user_id: str = Depends(get_current_user)
):

    if when == "today":
        first_date = datetime.now(timezone.utc)

    week_dates = []
    projection = {"_id": 0}
    for i in range(7):
        date = (first_date - timedelta(days=i)).strftime("%d-%m-%Y")
        week_dates.append(date)
        projection[f"plants.{date}"] = 1

    list_of_plants = await app.mongodb["users"].find_one({"_id": user_id}, projection)

    plants_list = []
    plant_id_set = set()
    for date in week_dates:
        if date in list_of_plants["plants"]:
            for plant_id, values in list_of_plants["plants"][date].items():
                if plant_id not in plant_id_set:
                    plants_list.append({"_id": plant_id, **values})
                    plant_id_set.add(plant_id)

    return plants_list


@app.delete("/user/logout")
async def logout(session_id: str = Depends(get_current_session)):
    result = await app.mongodb["sessions"].delete_one({"_id": ObjectId(session_id)})

    if result.deleted_count == 1:
        return {"message": "User successfully logged out"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )
