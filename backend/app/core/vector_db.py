"""
向量数据库模块 - PostgreSQL pgvector 支持
提供向量存储和相似度搜索功能
"""
from typing import List, Optional, Tuple, Any
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database_async import AsyncSessionLocal
from app.utils.logger import app_logger


class VectorDBError(Exception):
    """向量数据库操作错误"""
    pass


class VectorDB:
    """
    向量数据库管理类
    封装 pgvector 扩展的操作
    """

    # 支持的相似度度量方法
    DISTANCE_METRICS = {
        'cosine': '<=>',  # 余弦相似度（1 - cosine_distance）
        'l2': '<->',      # L2/Euclidean 距离
        'inner_product': '<#>',  # 内积（负值，越大越相似）
        'l1': '<+>',      # L1/Manhattan 距离
    }

    def __init__(self, dimension: int = 1536):
        """
        初始化向量数据库
        
        Args:
            dimension: 向量维度，默认 1536（OpenAI text-embedding-ada-002）
        """
        self.dimension = dimension

    async def initialize_extension(self, session: AsyncSession) -> bool:
        """
        初始化 pgvector 扩展
        应在数据库迁移或首次启动时调用
        
        Args:
            session: 异步数据库会话
            
        Returns:
            bool: 是否成功
        """
        try:
            # 创建 pgvector 扩展
            await session.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await session.commit()
            
            app_logger.info("pgvector extension initialized successfully")
            return True
        except Exception as e:
            await session.rollback()
            app_logger.error(f"Failed to initialize pgvector extension: {e}")
            return False

    async def check_extension(self, session: AsyncSession) -> bool:
        """
        检查 pgvector 扩展是否已安装
        
        Args:
            session: 异步数据库会话
            
        Returns:
            bool: 是否已安装
        """
        try:
            result = await session.execute(
                text("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')")
            )
            exists = result.scalar()
            return exists
        except Exception as e:
            app_logger.error(f"Failed to check pgvector extension: {e}")
            return False

    def format_vector(self, embedding: List[float]) -> str:
        """
        将向量格式化为 PostgreSQL vector 字符串
        
        Args:
            embedding: 向量列表
            
        Returns:
            str: PostgreSQL vector 格式字符串 '[a,b,c,...]'
        """
        if len(embedding) != self.dimension:
            raise ValueError(f"Vector dimension mismatch: expected {self.dimension}, got {len(embedding)}")
        
        return '[' + ','.join(str(x) for x in embedding) + ']'

    async def similarity_search(
        self,
        session: AsyncSession,
        table_name: str,
        vector_column: str,
        query_vector: List[float],
        top_k: int = 5,
        metric: str = 'cosine',
        filters: Optional[dict] = None,
        return_fields: Optional[List[str]] = None,
    ) -> List[Tuple[Any, float]]:
        """
        执行向量相似度搜索
        
        Args:
            session: 异步数据库会话
            table_name: 表名
            vector_column: 存储向量的列名
            query_vector: 查询向量
            top_k: 返回结果数量
            metric: 相似度度量方法 ('cosine', 'l2', 'inner_product', 'l1')
            filters: 额外过滤条件 {'column': value}
            return_fields: 返回的字段列表，None 返回所有字段
            
        Returns:
            List[Tuple[Row, distance]]: 结果列表和距离
        """
        if metric not in self.DISTANCE_METRICS:
            raise ValueError(f"Unsupported metric: {metric}. Use one of {list(self.DISTANCE_METRICS.keys())}")
        
        operator = self.DISTANCE_METRICS[metric]
        vector_str = self.format_vector(query_vector)
        
        # 构建查询字段
        if return_fields:
            fields_str = ', '.join(return_fields)
        else:
            fields_str = '*'
        
        # 构建基础查询
        query = f"""
            SELECT {fields_str}, {vector_column} {operator} :query_vector::vector as distance
            FROM {table_name}
            WHERE {vector_column} IS NOT NULL
        """
        
        params = {'query_vector': vector_str}
        
        # 添加过滤条件
        if filters:
            for idx, (column, value) in enumerate(filters.items()):
                param_name = f'filter_{idx}'
                query += f" AND {column} = :{param_name}"
                params[param_name] = value
        
        # 排序和限制
        query += f"""
            ORDER BY {vector_column} {operator} :query_vector::vector
            LIMIT :top_k
        """
        params['top_k'] = top_k
        
        try:
            result = await session.execute(text(query), params)
            rows = result.fetchall()
            
            # 解析结果
            results = []
            for row in rows:
                # distance 是最后一个字段
                distance = row[-1]
                # 其余字段作为字典返回
                row_dict = {key: value for key, value in zip(result.keys()[:-1], row[:-1])}
                results.append((row_dict, distance))
            
            return results
        except Exception as e:
            app_logger.error(f"Similarity search failed: {e}")
            raise VectorDBError(f"Similarity search failed: {e}")

    async def find_similar_vectors(
        self,
        session: AsyncSession,
        table_name: str,
        vector_column: str,
        query_vector: List[float],
        threshold: float = 0.8,
        top_k: int = 10,
        metric: str = 'cosine',
    ) -> List[dict]:
        """
        查找相似向量（带阈值过滤）
        
        Args:
            session: 异步数据库会话
            table_name: 表名
            vector_column: 向量列名
            query_vector: 查询向量
            threshold: 相似度阈值（对于 cosine，值越大越相似）
            top_k: 最大返回数量
            metric: 相似度度量方法
            
        Returns:
            List[dict]: 相似向量列表，包含 similarity 字段
        """
        results = await self.similarity_search(
            session=session,
            table_name=table_name,
            vector_column=vector_column,
            query_vector=query_vector,
            top_k=top_k,
            metric=metric,
        )
        
        # 转换距离为相似度并过滤
        filtered_results = []
        for row, distance in results:
            if metric == 'cosine':
                # cosine 距离 = 1 - 相似度
                similarity = 1 - distance
            elif metric == 'inner_product':
                # 内积越大越相似，通常需要归一化
                similarity = -distance  # 转换为正值
            else:
                # L1/L2 距离越小越相似，需要反转
                similarity = 1 / (1 + distance)
            
            if similarity >= threshold:
                row['similarity'] = round(similarity, 4)
                filtered_results.append(row)
        
        return filtered_results

    async def create_vector_index(
        self,
        session: AsyncSession,
        table_name: str,
        column_name: str,
        index_name: Optional[str] = None,
        index_type: str = 'ivfflat',
        lists: int = 100,
    ) -> bool:
        """
        创建向量索引以加速相似度搜索
        
        Args:
            session: 异步数据库会话
            table_name: 表名
            column_name: 向量列名
            index_name: 索引名称，默认自动生成
            index_type: 索引类型 ('ivfflat', 'hnsw')
            lists: IVFFlat 的列表数量（约等于行数/1000）
            
        Returns:
            bool: 是否成功
        """
        if index_name is None:
            index_name = f"idx_{table_name}_{column_name}_vector"
        
        try:
            if index_type == 'ivfflat':
                # IVFFlat 索引 - 适合精确度要求不高的场景
                query = f"""
                    CREATE INDEX IF NOT EXISTS {index_name}
                    ON {table_name}
                    USING ivfflat ({column_name} vector_cosine_ops)
                    WITH (lists = {lists})
                """
            elif index_type == 'hnsw':
                # HNSW 索引 - 适合高维向量，构建慢但查询快
                query = f"""
                    CREATE INDEX IF NOT EXISTS {index_name}
                    ON {table_name}
                    USING hnsw ({column_name} vector_cosine_ops)
                """
            else:
                raise ValueError(f"Unsupported index type: {index_type}")
            
            await session.execute(text(query))
            await session.commit()
            
            app_logger.info(f"Created vector index: {index_name}")
            return True
        except Exception as e:
            await session.rollback()
            app_logger.error(f"Failed to create vector index: {e}")
            return False


# 全局向量数据库实例
vector_db = VectorDB(dimension=1536)


async def get_vector_db() -> VectorDB:
    """
    获取向量数据库实例的依赖函数
    
    Usage:
        async def search_memories(
            vector_db: VectorDB = Depends(get_vector_db),
        ):
            results = await vector_db.similarity_search(...)
    """
    return vector_db
