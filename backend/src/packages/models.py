from enum import Enum
from typing import Annotated
from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
)


class AuthorizationResponse(BaseModel):
    # state: str
    code: str


class Token(BaseModel):
    access_token: str
    session_id: str


class PlantCategory(str, Enum):
    fruit = "fruit"
    vegetable = "vegetable"
    seeds = "seeds"
    nuts = "nuts"
    grain = "grain"
    herb = "herb"
    spice = "spice"
    beans = "beans"
    pulses = "pulses"
    legumes = "legumes"


class Plant(BaseModel):
    id: Annotated[str, BeforeValidator(str)] = Field(alias="_id", default=None)
    name: str
    category: PlantCategory
    count: int | None = None
    model_config = ConfigDict(populate_by_name=True)
