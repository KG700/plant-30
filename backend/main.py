from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from datetime import date
from config import logger
from packages.mongodb import lifespan
from packages.models import Plant

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


@app.post("/user/{user_id}/add-plant/{plant_id}")
async def add_plant(user_id: str, plant_id: str):
    plant_to_add = await app.mongodb["plants"].find_one(
        {"_id": ObjectId(plant_id)}, {"_id": 0}
    )
    plant_to_add["id"] = plant_id
    todays_date = date.today().strftime("%d-%m-%Y")
    plant_key = "plants.%s" % todays_date

    await app.mongodb["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {plant_key: plant_to_add}},
        upsert=True,
    )

    return 200


@app.get("/user/{user_id}/plants")
async def get_plants(user_id: str, when: str = "today"):
    todays_date = date.today().strftime("%d-%m-%Y")

    if when == "today":
        plant_key = "plants.%s" % todays_date

    list_of_plants = await app.mongodb["users"].find_one(
        {"_id": ObjectId(user_id)}, {"_id": 0, plant_key: 1}
    )

    return list_of_plants["plants"][todays_date]
