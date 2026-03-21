import redis.asyncio as redis
import json
from typing import Any, Optional, Union, Dict, List, Callable
from app.core.config import settings
from app.utils.logger import app_logger


class CacheService:
    """
    Redis缓存服务类 - 使用JSON序列化（安全且兼容）
    
    修改说明：
    - 移除了 pickle 序列化，改用 JSON（更安全，无RCE风险）
    - 对于复杂对象，通过自定义Encoder/Decoder处理
    - 保留压缩功能用于大对象
    """

    def __init__(self):
        self.redis = None

    async def connect(self):
        """
        连接到Redis服务器
        """
        try:
            self.redis = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                db=settings.REDIS_DB,
                decode_responses=False,  # We'll handle serialization manually
                encoding="utf-8",
            )
            app_logger.info("Connected to Redis successfully")
        except Exception as e:
            app_logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def close(self):
        """
        关闭Redis连接
        """
        if self.redis:
            await self.redis.aclose()

    def _serialize(self, value: Any) -> bytes:
        """
        将值序列化为JSON字节
        支持基本类型、列表、字典和可JSON序列化的对象
        """
        try:
            return json.dumps(value, ensure_ascii=False, default=str).encode('utf-8')
        except (TypeError, ValueError) as e:
            app_logger.error(f"JSON serialization failed: {e}")
            raise

    def _deserialize(self, data: bytes) -> Any:
        """
        将JSON字节反序列化为Python对象
        """
        try:
            return json.loads(data.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            app_logger.error(f"JSON deserialization failed: {e}")
            raise

    async def set(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = 3600
    ) -> bool:
        """
        设置缓存值
        :param key: 键
        :param value: 值
        :param expire: 过期时间（秒）
        :return: 是否设置成功
        """
        try:
            serialized_value = self._serialize(value)
            result = await self.redis.set(key, serialized_value, ex=expire)
            return result is not None
        except Exception as e:
            app_logger.error(f"Failed to set cache: {e}")
            return False

    async def get(self, key: str) -> Optional[Any]:
        """
        获取缓存值
        :param key: 键
        :return: 缓存的值，如果不存在则返回None
        """
        try:
            value = await self.redis.get(key)
            if value is not None:
                return self._deserialize(value)
            return None
        except Exception as e:
            app_logger.error(f"Failed to get cache: {e}")
            return None

    async def mget(self, keys: List[str]) -> List[Optional[Any]]:
        """
        批量获取多个缓存值
        :param keys: 键列表
        :return: 值列表
        """
        try:
            values = await self.redis.mget(keys)
            result = []
            for value in values:
                if value is not None:
                    result.append(self._deserialize(value))
                else:
                    result.append(None)
            return result
        except Exception as e:
            app_logger.error(f"Failed to get multiple cache values: {e}")
            return [None] * len(keys)

    async def mset(self, mapping: Dict[str, Any], expire: Optional[int] = 3600) -> bool:
        """
        批量设置多个缓存值
        :param mapping: 键值对映射
        :param expire: 过期时间（秒）
        :return: 是否设置成功
        """
        try:
            serialized_mapping = {}
            for key, value in mapping.items():
                serialized_mapping[key] = self._serialize(value)

            # 先执行批量设置
            result = await self.redis.mset(serialized_mapping)

            # 然后为每个键单独设置过期时间
            for key in mapping.keys():
                await self.redis.expire(key, expire)

            return result is not None
        except Exception as e:
            app_logger.error(f"Failed to set multiple cache values: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        删除缓存值
        :param key: 键
        :return: 是否删除成功
        """
        try:
            result = await self.redis.delete(key)
            return result > 0
        except Exception as e:
            app_logger.error(f"Failed to delete cache: {e}")
            return False

    async def delete_pattern(self, pattern: str, batch_size: int = 100) -> int:
        """
        根据模式删除多个缓存键（使用SCAN渐进式删除，避免KEYS命令阻塞Redis）
        :param pattern: 键模式，例如 "user:*" 或 "article:*"
        :param batch_size: 每批扫描的键数量，默认100
        :return: 删除的键的数量
        """
        try:
            deleted_count = 0
            cursor = 0

            # 使用SCAN渐进式扫描，避免KEYS命令阻塞Redis服务器
            while True:
                cursor, keys = await self.redis.scan(
                    cursor=cursor,
                    match=pattern,
                    count=batch_size
                )

                if keys:
                    # 批量删除当前批次的键
                    deleted_count += await self.redis.delete(*keys)

                # cursor为0表示扫描完成
                if cursor == 0:
                    break

            return deleted_count
        except Exception as e:
            app_logger.error(f"Failed to delete cache by pattern: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """
        检查缓存键是否存在
        :param key: 键
        :return: 是否存在
        """
        try:
            result = await self.redis.exists(key)
            return result > 0
        except Exception as e:
            app_logger.error(f"Failed to check cache existence: {e}")
            return False

    async def flush_all(self) -> bool:
        """
        清空所有缓存
        :return: 是否清空成功
        """
        try:
            await self.redis.flushall()
            return True
        except Exception as e:
            app_logger.error(f"Failed to flush cache: {e}")
            return False

    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """
        原子性地增加缓存值
        :param key: 键
        :param amount: 增加的数量
        :return: 新的值
        """
        try:
            result = await self.redis.incrby(key, amount)
            return result
        except Exception as e:
            app_logger.error(f"Failed to increment cache value: {e}")
            return None

    async def decrement(self, key: str, amount: int = 1) -> Optional[int]:
        """
        原子性地减少缓存值
        :param key: 键
        :param amount: 减少的数量
        :return: 新的值
        """
        try:
            result = await self.redis.decrby(key, amount)
            return result
        except Exception as e:
            app_logger.error(f"Failed to decrement cache value: {e}")
            return None

    async def set_with_compression(self, key: str, value: Any, expire: Optional[int] = 3600) -> bool:
        """
        设置缓存值，对于大对象自动压缩
        :param key: 键
        :param value: 值
        :param expire: 过期时间（秒）
        :return: 是否设置成功
        """
        try:
            import zlib
            serialized_value = self._serialize(value)

            # 如果序列化后的数据大于1KB，则进行压缩
            if len(serialized_value) > 1024:
                compressed_value = zlib.compress(serialized_value)
                # 在值前面加上标识表示这是压缩过的数据
                stored_value = b'COMPRESSED:' + compressed_value
            else:
                stored_value = serialized_value

            result = await self.redis.set(key, stored_value, ex=expire)
            return result is not None
        except Exception as e:
            app_logger.error(f"Failed to set compressed cache: {e}")
            return False

    async def get_with_decompression(self, key: str) -> Optional[Any]:
        """
        获取缓存值，自动解压压缩过的数据
        :param key: 键
        :return: 缓存的值，如果不存在则返回None
        """
        try:
            value = await self.redis.get(key)
            if value is not None:
                # 检查是否是压缩过的数据
                if value.startswith(b'COMPRESSED:'):
                    import zlib
                    compressed_data = value[11:]  # 移除 'COMPRESSED:' 前缀
                    decompressed_data = zlib.decompress(compressed_data)
                    return self._deserialize(decompressed_data)
                else:
                    return self._deserialize(value)
            return None
        except Exception as e:
            app_logger.error(f"Failed to get decompressed cache: {e}")
            return None

    # 哈希表操作支持
    async def hset(self, key: str, field: str, value: Any) -> bool:
        """
        设置哈希表字段
        """
        try:
            serialized = self._serialize(value)
            result = await self.redis.hset(key, field, serialized)
            return result is not None
        except Exception as e:
            app_logger.error(f"Failed to hset: {e}")
            return False

    async def hget(self, key: str, field: str) -> Optional[Any]:
        """
        获取哈希表字段
        """
        try:
            value = await self.redis.hget(key, field)
            if value is not None:
                return self._deserialize(value)
            return None
        except Exception as e:
            app_logger.error(f"Failed to hget: {e}")
            return None

    async def hgetall(self, key: str) -> Dict[str, Any]:
        """
        获取哈希表所有字段
        """
        try:
            result = await self.redis.hgetall(key)
            return {k.decode('utf-8'): self._deserialize(v) for k, v in result.items()}
        except Exception as e:
            app_logger.error(f"Failed to hgetall: {e}")
            return {}

    # 列表操作支持
    async def lpush(self, key: str, value: Any) -> int:
        """
        从左侧推入列表
        """
        try:
            serialized = self._serialize(value)
            return await self.redis.lpush(key, serialized)
        except Exception as e:
            app_logger.error(f"Failed to lpush: {e}")
            return 0

    async def rpush(self, key: str, value: Any) -> int:
        """
        从右侧推入列表
        """
        try:
            serialized = self._serialize(value)
            return await self.redis.rpush(key, serialized)
        except Exception as e:
            app_logger.error(f"Failed to rpush: {e}")
            return 0

    async def lrange(self, key: str, start: int = 0, end: int = -1) -> List[Any]:
        """
        获取列表范围
        """
        try:
            values = await self.redis.lrange(key, start, end)
            return [self._deserialize(v) for v in values]
        except Exception as e:
            app_logger.error(f"Failed to lrange: {e}")
            return []

    async def lpop(self, key: str) -> Optional[Any]:
        """
        从左侧弹出
        """
        try:
            value = await self.redis.lpop(key)
            if value is not None:
                return self._deserialize(value)
            return None
        except Exception as e:
            app_logger.error(f"Failed to lpop: {e}")
            return None

    # 集合操作支持
    async def sadd(self, key: str, value: Any) -> int:
        """
        添加集合成员
        """
        try:
            serialized = self._serialize(value)
            return await self.redis.sadd(key, serialized)
        except Exception as e:
            app_logger.error(f"Failed to sadd: {e}")
            return 0

    async def smembers(self, key: str) -> set:
        """
        获取集合所有成员
        """
        try:
            values = await self.redis.smembers(key)
            return {self._deserialize(v) for v in values}
        except Exception as e:
            app_logger.error(f"Failed to smembers: {e}")
            return set()

    async def sismember(self, key: str, value: Any) -> bool:
        """
        检查是否是集合成员
        """
        try:
            serialized = self._serialize(value)
            return await self.redis.sismember(key, serialized)
        except Exception as e:
            app_logger.error(f"Failed to sismember: {e}")
            return False

    # 有序集合操作支持
    async def zadd(self, key: str, mapping: Dict[Any, float]) -> int:
        """
        添加有序集合成员
        :param mapping: {value: score, ...}
        """
        try:
            # Redis expects {value: score}, but we need to serialize values
            serialized_mapping = {}
            for value, score in mapping.items():
                serialized = self._serialize(value)
                serialized_mapping[serialized] = score
            return await self.redis.zadd(key, serialized_mapping)
        except Exception as e:
            app_logger.error(f"Failed to zadd: {e}")
            return 0

    async def zrange(self, key: str, start: int, end: int, withscores: bool = False) -> List[Any]:
        """
        获取有序集合范围
        """
        try:
            if withscores:
                result = await self.redis.zrange(key, start, end, withscores=True)
                return [(self._deserialize(v), score) for v, score in result]
            else:
                values = await self.redis.zrange(key, start, end)
                return [self._deserialize(v) for v in values]
        except Exception as e:
            app_logger.error(f"Failed to zrange: {e}")
            return []

    async def zrem(self, key: str, value: Any) -> int:
        """
        从有序集合中移除成员
        """
        try:
            serialized = self._serialize(value)
            return await self.redis.zrem(key, serialized)
        except Exception as e:
            app_logger.error(f"Failed to zrem: {e}")
            return 0

    # 分布式锁
    async def acquire_lock(self, lock_name: str, timeout: int = 10, blocking: bool = True, blocking_timeout: int = 10) -> bool:
        """
        获取分布式锁
        :param lock_name: 锁名称
        :param timeout: 锁超时时间（秒）
        :param blocking: 是否阻塞等待
        :param blocking_timeout: 阻塞超时时间（秒）
        :return: 是否获取成功
        """
        try:
            import uuid
            lock_id = str(uuid.uuid4())
            lock_key = f"lock:{lock_name}"
            
            if blocking:
                import asyncio
                start_time = asyncio.get_event_loop().time()
                while True:
                    # NX = only if not exists, EX = expire time
                    result = await self.redis.set(lock_key, lock_id, nx=True, ex=timeout)
                    if result:
                        return True
                    if asyncio.get_event_loop().time() - start_time > blocking_timeout:
                        return False
                    await asyncio.sleep(0.1)
            else:
                return await self.redis.set(lock_key, lock_id, nx=True, ex=timeout)
        except Exception as e:
            app_logger.error(f"Failed to acquire lock: {e}")
            return False

    async def release_lock(self, lock_name: str) -> bool:
        """
        释放分布式锁
        :param lock_name: 锁名称
        :return: 是否释放成功
        """
        try:
            lock_key = f"lock:{lock_name}"
            return await self.redis.delete(lock_key) > 0
        except Exception as e:
            app_logger.error(f"Failed to release lock: {e}")
            return False

    # 带锁执行函数
    async def with_lock(self, lock_name: str, func: Callable, *args, timeout: int = 10, **kwargs) -> Any:
        """
        在分布式锁保护下执行函数
        :param lock_name: 锁名称
        :param func: 要执行的函数（可以是协程函数）
        :param timeout: 锁超时时间
        :return: 函数返回值
        """
        import asyncio
        
        acquired = await self.acquire_lock(lock_name, timeout=timeout)
        if not acquired:
            raise Exception(f"Could not acquire lock: {lock_name}")
        
        try:
            if asyncio.iscoroutinefunction(func):
                return await func(*args, **kwargs)
            else:
                return func(*args, **kwargs)
        finally:
            await self.release_lock(lock_name)


# 全局缓存服务实例
cache_service = CacheService()


# 便捷函数
async def cache_get_or_set(
    key: str,
    fetch_func,
    expire: Optional[int] = 3600,
    *args,
    **kwargs
) -> Any:
    """
    获取缓存值，如果不存在则调用fetch_func获取并存储到缓存
    :param key: 缓存键
    :param fetch_func: 获取数据的函数
    :param expire: 过期时间（秒）
    :param args: 传递给fetch_func的位置参数
    :param kwargs: 传递给fetch_func的关键字参数
    :return: 数据
    """
    # 尝试从缓存获取
    cached_value = await cache_service.get(key)
    if cached_value is not None:
        return cached_value

    # 如果缓存不存在，调用fetch_func获取数据
    import asyncio
    if asyncio.iscoroutinefunction(fetch_func):
        value = await fetch_func(*args, **kwargs)
    else:
        value = fetch_func(*args, **kwargs)

    # 存储到缓存
    await cache_service.set(key, value, expire)

    return value


async def cache_get_or_set_compressed(
    key: str,
    fetch_func,
    expire: Optional[int] = 3600,
    *args,
    **kwargs
) -> Any:
    """
    获取缓存值，如果不存在则调用fetch_func获取并存储到缓存（带压缩）
    :param key: 缓存键
    :param fetch_func: 获取数据的函数
    :param expire: 过期时间（秒）
    :param args: 传递给fetch_func的位置参数
    :param kwargs: 传递给fetch_func的关键字参数
    :return: 数据
    """
    # 尝试从缓存获取
    cached_value = await cache_service.get_with_decompression(key)
    if cached_value is not None:
        return cached_value

    # 如果缓存不存在，调用fetch_func获取数据
    import asyncio
    if asyncio.iscoroutinefunction(fetch_func):
        value = await fetch_func(*args, **kwargs)
    else:
        value = fetch_func(*args, **kwargs)

    # 存储到缓存（带压缩）
    await cache_service.set_with_compression(key, value, expire)

    return value


# 缓存装饰器
def cached(key_prefix: str, expire: int = 3600, key_builder: Optional[Callable] = None):
    """
    缓存装饰器 - 用于缓存函数结果
    
    Usage:
        @cached("user_info", expire=3600)
        async def get_user_info(user_id: int):
            return await fetch_user_from_db(user_id)
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # 构建缓存键
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # 默认使用函数名+参数构建
                key_parts = [key_prefix]
                key_parts.extend([str(arg) for arg in args])
                key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
                cache_key = ":".join(key_parts)
            
            # 尝试从缓存获取
            cached_value = await cache_service.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # 执行函数
            import asyncio
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            # 存入缓存
            await cache_service.set(cache_key, result, expire)
            
            return result
        
        return wrapper
    return decorator


# 缓存失效辅助函数
async def invalidate_cache_pattern(pattern: str) -> int:
    """
    根据模式使缓存失效
    :param pattern: 缓存键模式
    :return: 删除的键数量
    """
    return await cache_service.delete_pattern(pattern)


async def invalidate_cache(*keys: str) -> int:
    """
    使指定缓存键失效
    :param keys: 缓存键列表
    :return: 删除的键数量
    """
    count = 0
    for key in keys:
        if await cache_service.delete(key):
            count += 1
    return count
