from bson import ObjectId
from fastapi import FastAPI
from config import logger
from packages.mongodb import lifespan
from packages.models import Plant

app = FastAPI(lifespan=lifespan)

@app.post("/create-plant", response_model=Plant)
async def create_plant(plant: Plant) -> Plant:
    new_plant = await app.mongodb["plants"].insert_one(plant.model_dump())
    plant.id = str(new_plant.inserted_id)
    return plant

@app.post("/add-plant/{userId}", response_model=Plant)
async def add_plant(userId: str, plant: Plant):
    todays_date = '25-02-2025'
    plant_key = 'plants.%s' % todays_date

    await app.mongodb['users'].update_one( { '_id': ObjectId(userId) }, { '$push': { plant_key: plant.model_dump() } }, upsert=True )
    return plant