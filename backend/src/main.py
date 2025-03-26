from fastapi import FastAPI
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


@app.post("/create-plant", response_model=Plant)
async def create_plant(plant: Plant) -> Plant:
    new_plant = await app.mongodb["plants"].insert_one(plant.model_dump())
    plant.id = str(new_plant.inserted_id)

    return plant


@app.get("/plants/all")
async def get_all_plants():
    plants = await app.mongodb["plants"].find({}).to_list(1000)

    for plant in plants:
        plant["_id"] = str(plant["_id"])

    return jsonable_encoder(plants)


@app.post("/user/{user_id}/add-plant/{plant_id}")
async def add_plant(user_id: str, plant_id: str):
    plant_to_add = await app.mongodb["plants"].find_one(
        {"_id": ObjectId(plant_id)}, {"_id": 0}
    )

    # TODO: what happens if plant_id doesn't exist?

    plant_to_add = dict(plant_to_add)
    plant_to_add["id"] = plant_id
    todays_date = date.today().strftime("%d-%m-%Y")
    plant_key = "plants.%s" % todays_date

    await app.mongodb["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {plant_key: plant_to_add}},
        upsert=True,
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
