"""服务器启动类

用于管理和启动后端服务，提供灵活的配置选项
"""

import uvicorn
from app.main import app
from app.core.config import settings
from app.utils.logger import app_logger


def run_migrations():
    """运行数据库迁移"""
    try:
        from alembic.config import Config
        from alembic import command

        app_logger.info("Checking for database migrations...")

        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")

        app_logger.info("Database migrations completed successfully")
        return True
    except Exception as e:
        app_logger.error(f"Database migration failed: {e}")
        print(f"\n[ERROR] Database migration failed: {e}")
        print("Please check your database connection and run migrations manually:")
        print("  cd backend && alembic upgrade head\n")
        return False


class ServerStarter:
    """服务器启动器类
    
    提供多种启动选项和配置管理
    """
    
    def __init__(self, host: str = "127.0.0.1", port: int = 8989):
        """
        初始化服务器启动器
        
        Args:
            host: 服务器主机地址，默认为 "127.0.0.1"
            port: 服务器端口，默认为 8989
        """
        self.host = host
        self.port = port
        self.app = app

    def start(self, reload: bool = False, workers: int = 1, run_db_migration: bool = True):
        """
        启动服务器

        Args:
            reload: 是否启用热重载，默认为 False
            workers: 工作进程数，默认为 1
            run_db_migration: 是否在启动前运行数据库迁移，默认为 True
        """
        print(f"Starting {settings.APP_NAME} server on {self.host}:{self.port}")

        # 运行数据库迁移
        if run_db_migration:
            print("\n[Database] Running migrations...")
            if not run_migrations():
                print("\n[WARNING] Database migration failed, but continuing to start server...")
                print("          Some features may not work correctly.\n")

        print(f"\nAccess the API documentation at http://{self.host}:{self.port}/docs\n")

        uvicorn.run(
            self.app,
            host=self.host,
            port=self.port,
            reload=reload,
            workers=workers
        )

    def start_dev(self):
        """启动开发模式服务器（启用热重载）"""
        print(f"Starting {settings.APP_NAME} in development mode...")
        self.start(reload=True)

    def start_prod(self, workers: int = 4):
        """启动生产模式服务器"""
        print(f"Starting {settings.APP_NAME} in production mode...")
        self.start(reload=False, workers=workers)


if __name__ == "__main__":
    # 默认启动服务器
    starter = ServerStarter()
    starter.start()