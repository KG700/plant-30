from fastapi import FastAPI
from config import logger
from packages.mongodb import lifespan
from packages.models import Plant

app = FastAPI(lifespan=lifespan)

@app.post("/create-plant", response_model=Plant)
async def create_plant(plant: Plant) -> Plant:
    new_plant = await app.mongodb["plants"].insert_one(plant.model_dump())
    plant.id = str(new_plant.inserted_id)
    logger.debug('created plant')
    return plant
