from enum import Enum
from pydantic import BaseModel

class PlantCategory(str, Enum):
    fruit = "fruit"
    vegetable = "vegetable"
    nuts = "nuts"
    grain = "grain"
    herb = "herb"
    spice = "spice"
    beans = "beans"
    pulses = "pulses"

class Plant(BaseModel):
    id: str | None = None
    name: str
    category: PlantCategory
