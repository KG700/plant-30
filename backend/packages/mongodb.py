from fastapi import FastAPI
from config import Settings
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager

settings = Settings()


async def lifespan(app: FastAPI):
    # Start the database connection
    await startup_db_client(app)
    yield
    # Close the database connection
    await shutdown_db_client(app)


async def startup_db_client(app):
    username = settings.username
    password = settings.password
    cluster = settings.mongodb_uri

    app.mongodb_client = AsyncIOMotorClient(
        "mongodb+srv://%s:%s@%s/" % (username, password, cluster)
    )
    app.mongodb = app.mongodb_client.get_database("plants30")
    print("MongoDB connected.")


# method to close the database connection
async def shutdown_db_client(app):
    app.mongodb_client.close()
    print("Database disconnected.")
