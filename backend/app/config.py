import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "ORBITAL SHIELD API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Space weather data source endpoints
    NOAA_BASE_URL: str = os.getenv("NOAA_BASE_URL", "https://services.swpc.noaa.gov")
    NASA_DONKI_URL: str = os.getenv("NASA_DONKI_URL", "https://api.nasa.gov/DONKI")
    NASA_API_KEY: str = os.getenv("NASA_API_KEY", "DEMO_KEY")
    
    # Server configuration
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "*"
    ]
    
    CACHE_TTL_SECONDS: int = 300  # 5 minutes cache

settings = Settings()
