import redis.asyncio as redis
from app.core.config import settings

class RedisClient:
    def __init__(self):
        # Usar REDIS_URL si existe, sino construirla (fallback)
        if hasattr(settings, 'REDIS_URL') and settings.REDIS_URL:
            self.redis_url = settings.REDIS_URL
        else:
            # Fallback por si REDIS_URL no está definido pero host/port sí
            host = getattr(settings, 'REDIS_HOST', 'redis')
            port = getattr(settings, 'REDIS_PORT', 6379)
            self.redis_url = f"redis://{host}:{port}/0"
            
        self.client = None

    async def connect(self):
        self.client = redis.from_url(self.redis_url, encoding="utf-8", decode_responses=True)

    async def close(self):
        if self.client:
            await self.client.close()

    async def get(self, key: str):
        return await self.client.get(key)

    async def set(self, key: str, value: str, expire: int = None):
        await self.client.set(key, value, ex=expire)

    async def mget(self, keys: list):
        return await self.client.mget(keys)

    async def mset(self, mapping: dict):
        await self.client.mset(mapping)

redis_client = RedisClient()
