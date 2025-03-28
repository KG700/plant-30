from fastapi import FastAPI, HTTPException, status
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from datetime import date
from src.packages.config import logger
from src.packages.mongodb import lifespan
from src.packages.models import Plant

app = FastAPI(lifespan=lifespan)

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/create-plant", response_model=Plant, status_code=201)
async def create_plant(plant: Plant):
    new_plant = await app.mongodb["plants"].insert_one(
        plant.model_dump(by_alias=True, exclude=["id"])
    )
    created_plant = await app.mongodb["plants"].find_one({"_id": new_plant.inserted_id})

    return Plant(**created_plant)


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


@app.post("/user/{user_id}/add-plant/{plant_id}")
async def add_plant(user_id: str, plant_id: str):
    plant_to_add = await app.mongodb["plants"].find_one(
        {"_id": ObjectId(plant_id)}, {"_id": 0}
    )

    if plant_to_add is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found"
        )

    plant_to_add = dict(plant_to_add)
    plant_to_add["id"] = plant_id
    todays_date = date.today().strftime("%d-%m-%Y")
    plant_key = "plants.%s" % todays_date

    result = await app.mongodb["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {plant_key: plant_to_add}},
        upsert=True,
    )

    if result.raw_result["nModified"] == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plant already exists in user's collection",
        )

    return plant_to_add


@app.get("/user/{user_id}/plants")
async def get_plants(user_id: str, when: str = "today"):
    todays_date = date.today().strftime("%d-%m-%Y")

    if when == "today":
        plant_key = "plants.%s" % todays_date

    list_of_plants = await app.mongodb["users"].find_one(
        {"_id": ObjectId(user_id)}, {"_id": 0, plant_key: 1}
    )

    if todays_date in list_of_plants["plants"]:
        return list_of_plants["plants"][todays_date]
    else:
        return []
