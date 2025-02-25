from fastapi import FastAPI
from bson import ObjectId
from datetime import date
from config import logger
from packages.mongodb import lifespan
from packages.models import Plant

app = FastAPI(lifespan=lifespan)

@app.post("/create-plant", response_model=Plant)
async def create_plant(plant: Plant) -> Plant:
    new_plant = await app.mongodb["plants"].insert_one(plant.model_dump())
    plant.id = str(new_plant.inserted_id)
    return plant

@app.post("/user/{userId}/add-plant/{plantId}")
async def add_plant(userId: str, plantId: str):    
    plant_to_add = await app.mongodb['plants'].find_one( {'_id': ObjectId(plantId) } )
    
    todays_date = date.today().strftime('%d-%m-%Y')
    plant_key = 'plants.%s' % todays_date
    
    await app.mongodb['users'].update_one( { '_id': ObjectId(userId) }, { '$addToSet': { plant_key: plant_to_add } }, upsert=True )
    return 200