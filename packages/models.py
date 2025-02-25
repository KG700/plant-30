from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

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
    id: str | None = Field(alias="_id", default=None)
    name: str
    category: PlantCategory
