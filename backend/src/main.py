from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from datetime import date, datetime, timezone, timedelta

from fastapi.security import HTTPBearer
from src.packages.config import get_settings
from src.packages.config import logger
from src.packages.mongodb import lifespan
from src.packages.models import AuthorizationResponse, Token, Plant, PlantCategory
from urllib.parse import urlencode
from httpx import AsyncClient
import re

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


def validate_date(date_string):
    # 1. check date is correct format: dd-mm-yyyy
    date_format_regex = r"(0[1-9]|[12]\d|3[01])-(0[1-9]|1[1,2])-(19|20)\d{2}"
    if not re.match(date_format_regex, date_string):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date: must be in the format dd-mm-yyyy",
        )

    # 2. check date is an actual date
    try:
        datetime.strptime(date_string, "%d-%m-%Y")
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date: " + repr(error),
        )

    # 3. check date is today or in past
    if datetime.strptime(date_string, "%d-%m-%Y").date() > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date: cannot be in the future",
        )

    return date_string


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

    plant.count = 0

    new_plant = await app.mongodb["plants"].insert_one(
        plant.model_dump(by_alias=True, exclude=["id"])
    )
    created_plant = await app.mongodb["plants"].find_one({"_id": new_plant.inserted_id})

    return Plant(**created_plant)


@app.delete("/user/delete-plant/{plant_id}")
async def delete_plant(
    plant_id: str, when: str = "today", user_id: str = Depends(get_current_user)
):

    if when == "today":
        the_date = date.today().strftime("%d-%m-%Y")
    elif when == "yesterday":
        the_date = (date.today() - timedelta(days=1)).strftime("%d-%m-%Y")
    else:
        the_date = validate_date(when)

    plant_key = f"plants.{the_date}.{plant_id}"
    result = await app.mongodb["users"].update_one(
        {"_id": user_id, plant_key: {"$exists": True}},
        {"$unset": {plant_key: ""}, "$inc": {f"stats.{plant_id}.count": -1}},
    )

    await app.mongodb["plants"].update_one(
        {"_id": ObjectId(plant_id)},
        {"$inc": {"count": -1}},
    )

    if result.modified_count == 1:
        return {"message": "Plant successfully deleted"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Unable to delete plant"
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
async def add_plant(
    plant_id: str, when: str = "today", user_id: str = Depends(get_current_user)
):
    plant_to_add = await app.mongodb["plants"].find_one(
        {"_id": ObjectId(plant_id)}, {"_id": 0, "count": 0}
    )

    if plant_to_add is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found"
        )

    if when == "today":
        the_date = date.today().strftime("%d-%m-%Y")
    elif when == "yesterday":
        the_date = (date.today() - timedelta(days=1)).strftime("%d-%m-%Y")
    else:
        the_date = validate_date(when)

    plant_key = f"plants.{the_date}.{plant_id}"

    is_plant_in_db = await app.mongodb["users"].find_one({"_id": user_id}, {"_id": 0})

    if (
        (is_plant_in_db is not None)
        and (the_date in is_plant_in_db["plants"])
        and (plant_id in is_plant_in_db["plants"][the_date])
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plant already exists in user's collection",
        )

    await app.mongodb["users"].update_one(
        {"_id": user_id},
        {
            "$set": {plant_key: plant_to_add},
            "$inc": {f"stats.{plant_id}.count": 1},
        },
        upsert=True,
    )

    await app.mongodb["plants"].update_one(
        {"_id": ObjectId(plant_id)},
        {
            "$inc": {"count": 1},
        },
        upsert=True,
    )

    return {"id": plant_id, **plant_to_add}


@app.get("/user/day-plants")
async def get_daily_plants(
    when: str = "today", user_id: str = Depends(get_current_user)
):

    if when == "today":
        the_date = date.today().strftime("%d-%m-%Y")
    elif when == "yesterday":
        the_date = (date.today() - timedelta(days=1)).strftime("%d-%m-%Y")
    else:
        the_date = validate_date(when)

    plant_key = f"plants.{the_date}"

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
        the_date = datetime.now(timezone.utc)
    elif when == "yesterday":
        the_date = datetime.now(timezone.utc) - timedelta(days=1)
    else:
        the_date = datetime.strptime(validate_date(when), "%d-%m-%Y")

    week_dates = []
    projection = {"_id": 0}
    for i in range(7):
        day_of_week = (the_date - timedelta(days=i)).strftime("%d-%m-%Y")
        week_dates.append(day_of_week)
        projection[f"plants.{day_of_week}"] = 1

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


async def get_favourite_plants(user_id, excluded_ids):
    all_user_plants_object = await app.mongodb["users"].find_one(
        {"_id": user_id}, {"_id": 0, "stats": 1}
    )

    all_user_plants_list = []
    for plant_id in all_user_plants_object["stats"]:
        if plant_id not in excluded_ids:
            all_user_plants_list.append(
                {
                    "id": plant_id,
                    "count": all_user_plants_object["stats"][plant_id]["count"],
                }
            )

    sorted_count = sorted(
        all_user_plants_list, key=lambda plant: plant["count"], reverse=True
    )

    sorted_ids = []
    for plant in sorted_count:
        sorted_ids.append(ObjectId(plant["id"]))

    fav_plants = (
        await app.mongodb["plants"]
        .find({"_id": {"$in": sorted_ids}}, {"count": 0})
        .to_list(1000)
    )

    for plant in fav_plants:
        plant["_id"] = str(plant["_id"])

    return fav_plants


async def get_popular_plants(excluded_ids):
    plant_ids_to_exclude_list = []

    for plant_id in excluded_ids:
        plant_ids_to_exclude_list.append(ObjectId(plant_id))

    plants = (
        await app.mongodb["plants"]
        .find({"_id": {"$not": {"$in": plant_ids_to_exclude_list}}})
        .to_list(1000)
    )

    for plant in plants:
        plant["_id"] = str(plant["_id"])

    sorted_plants = sorted(plants, key=lambda plant: plant["count"], reverse=True)
    return sorted_plants


@app.get("/user/plants/recommendations")
async def get_user_recommendations(user_id: str = Depends(get_current_user)):
    category_max = {
        PlantCategory.vegetable: 30,
        PlantCategory.fruit: 20,
        PlantCategory.legumes: 10,
        PlantCategory.beans: 10,
        PlantCategory.nuts: 10,
        PlantCategory.seeds: 10,
        PlantCategory.grain: 10,
        PlantCategory.herb: 5,
        PlantCategory.spice: 5,
    }

    weekly_plants_list = await get_weekly_plants("today", user_id)

    plant_ids_to_exclude = set()
    for plant in weekly_plants_list:
        plant_ids_to_exclude.add(plant["_id"])

    user_favourites = await get_favourite_plants(user_id, plant_ids_to_exclude)

    for plant in user_favourites:
        plant_ids_to_exclude.add(plant["_id"])

    popular_plants = await get_popular_plants(plant_ids_to_exclude)

    plants = user_favourites + popular_plants

    recommendations = {}

    if len(plants) > 0:

        for category in PlantCategory:
            i = 0
            while (
                category not in recommendations
                or len(recommendations[category]) < category_max[category]
            ) and i < len(plants):
                if plants[i]["category"] == category:
                    plant_id = plants[i]["_id"]
                    name = plants[i]["name"]
                    recommendations.setdefault(category, []).append(
                        {"_id": plant_id, "name": name}
                    )
                i += 1

    return recommendations


@app.delete("/user/logout")
async def logout(session_id: str = Depends(get_current_session)):
    result = await app.mongodb["sessions"].delete_one({"_id": ObjectId(session_id)})

    if result.deleted_count == 1:
        return {"message": "User successfully logged out"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )
