import json
import uuid
from typing import Optional, List

try:
    from minio import Minio
    from minio.error import S3Error
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False

from app.core.config import settings
from app.utils.logger import app_logger


class OSSService:
    """
    MinIO 对象存储服务类（S3 兼容，替代阿里云 OSS）

    保持原 OSSService 的 upload_file / upload_multiple_files / delete_file /
    file_exists 方法签名不变，调用方（images / oss_upload / users 端点）零改动。
    文件对外 URL 格式：{MINIO_PUBLIC_BASE_URL}/minio/{bucket}/{key}，
    由 nginx location /minio/ 反代到 MinIO 容器。
    """

    def __init__(self):
        self.endpoint = settings.MINIO_ENDPOINT
        self.access_key = settings.MINIO_ACCESS_KEY
        self.secret_key = settings.MINIO_SECRET_KEY
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self.public_base_url = settings.MINIO_PUBLIC_BASE_URL.rstrip('/')
        self.client = None

        if not MINIO_AVAILABLE:
            app_logger.warning("minio 模块未安装，对象存储功能将不可用")
            return

        if not self.access_key or not self.secret_key:
            app_logger.warning("MinIO 凭证未配置，对象存储功能将不可用")
            return

        # endpoint 可能含 http(s):// 前缀，Minio 构造时需拆开
        scheme = "http"
        host = self.endpoint
        if "://" in self.endpoint:
            scheme, host = self.endpoint.split("://", 1)

        self.client = Minio(
            host,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=(scheme == "https"),
        )
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        """确保 bucket 存在并设为公开读（博客图片长期存 URL，预签名会过期不适用）"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                app_logger.info(f"MinIO bucket created: {self.bucket_name}")
            # 公开读策略：允许匿名 GET
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": ["*"]},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{self.bucket_name}/*"],
                    }
                ],
            }
            self.client.set_bucket_policy(self.bucket_name, json.dumps(policy))
        except Exception as e:
            app_logger.error(f"MinIO bucket init error: {e}")

    def _build_url(self, object_name: str) -> str:
        """构造对外可访问的 URL：{public_base}/minio/{bucket}/{key}"""
        return f"{self.public_base_url}/minio/{self.bucket_name}/{object_name}"

    def _extract_object_name(self, file_url: str) -> Optional[str]:
        """从对外 URL 反解出 object key（供删除用），失败返回 None"""
        prefix = f"{self.public_base_url}/minio/{self.bucket_name}/"
        if file_url.startswith(prefix):
            return file_url[len(prefix):]
        # 兜底：兼容直接以 bucket/key 结尾的 URL
        marker = f"/{self.bucket_name}/"
        idx = file_url.rfind(marker)
        if idx >= 0:
            return file_url[idx + len(marker):]
        return None

    def upload_file(self, file_data: bytes, file_name: str, folder: str = "uploads") -> Optional[str]:
        """
        上传文件到 MinIO
        :param file_data: 文件数据
        :param file_name: 文件名
        :param folder: 存储文件夹
        :return: 文件的URL，如果上传失败则返回None
        """
        if not self.client:
            app_logger.error("MinIO 未初始化，无法上传文件")
            return None

        try:
            # 生成唯一的文件路径
            unique_filename = f"{folder}/{uuid.uuid4()}_{file_name}"

            # 上传文件（自动探测 Content-Type）
            result = self.client.put_object(
                self.bucket_name,
                unique_filename,
                __import__('io').BytesIO(file_data),
                length=len(file_data),
            )

            file_url = self._build_url(unique_filename)
            app_logger.info(f"文件上传成功: {file_url}")
            return file_url

        except Exception as e:
            app_logger.error(f"上传文件时发生错误: {str(e)}")
            return None

    def upload_multiple_files(self, files_data: List[dict], folder: str = "uploads") -> Optional[List[str]]:
        """
        批量上传多个文件到 MinIO
        :param files_data: 包含文件数据和文件名的列表，例如 [{'data': b'...', 'name': 'file.jpg'}, ...]
        :param folder: 存储文件夹
        :return: 成功上传的文件URL列表，如果上传失败则返回None
        """
        if not self.client:
            app_logger.error("MinIO 未初始化，无法批量上传文件")
            return None

        import io
        try:
            uploaded_urls = []
            for file_info in files_data:
                file_data = file_info['data']
                file_name = file_info['name']

                # 生成唯一的文件路径
                unique_filename = f"{folder}/{uuid.uuid4()}_{file_name}"

                # 上传文件
                self.client.put_object(
                    self.bucket_name,
                    unique_filename,
                    io.BytesIO(file_data),
                    length=len(file_data),
                )

                file_url = self._build_url(unique_filename)
                app_logger.info(f"文件上传成功: {file_url}")
                uploaded_urls.append(file_url)

            return uploaded_urls

        except Exception as e:
            app_logger.error(f"批量上传文件时发生错误: {str(e)}")
            return None

    def delete_file(self, file_url: str) -> bool:
        """
        从 MinIO 删除文件
        :param file_url: 文件URL
        :return: 删除是否成功
        """
        if not self.client:
            app_logger.error("MinIO 未初始化，无法删除文件")
            return False

        try:
            object_name = self._extract_object_name(file_url)
            if not object_name:
                app_logger.error(f"无法从 URL 解析 object key: {file_url}")
                return False

            # 删除文件
            self.client.remove_object(self.bucket_name, object_name)
            app_logger.info(f"文件删除成功: {file_url}")
            return True

        except Exception as e:
            app_logger.error(f"删除文件时发生错误: {str(e)}")
            return False

    def file_exists(self, file_path: str) -> bool:
        """
        检查 MinIO 中是否存在指定文件
        :param file_path: 文件路径
        :return: 文件是否存在
        """
        if not self.client:
            app_logger.error("MinIO 未初始化，无法检查文件是否存在")
            return False

        try:
            object_name = self._extract_object_name(file_path) or file_path
            self.client.stat_object(self.bucket_name, object_name)
            return True
        except S3Error:
            return False
        except Exception as e:
            app_logger.error(f"检查文件是否存在时发生错误: {str(e)}")
            return False


# 全局对象存储服务实例
oss_service = OSSService()
