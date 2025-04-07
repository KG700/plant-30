from fastapi import FastAPI
from src.packages.config import get_settings
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.operations import IndexModel
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the database connection
    await startup_db_client(app)
    yield
    # Close the database connection
    await shutdown_db_client(app)


async def startup_db_client(app):
    username = get_settings().username
    password = get_settings().password
    cluster = get_settings().mongodb_uri

    app.mongodb_client = AsyncIOMotorClient(
        "mongodb+srv://{}:{}@{}/".format(username, password, cluster)
    )
    app.mongodb = app.mongodb_client.get_database("plants30")
    print("MongoDB connected.")

    ttl_index = IndexModel([("created_at")], expireAfterSeconds=3600)

    try:
        await app.mongodb["sessions"].create_indexes([ttl_index])
    except Exception as e:
        print(f"Error creating TTL index: {e}")


# method to close the database connection
async def shutdown_db_client(app):
    app.mongodb_client.close()
    print("Database disconnected.")
