"""
Initialize pgvector extension and create vector indexes
Run this script after database migration to set up pgvector

Usage:
    cd backend
    python scripts/init_pgvector.py
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import text
from app.core.database_async import AsyncSessionLocal, async_engine
from app.core.vector_db import vector_db
from app.utils.logger import app_logger


async def init_pgvector():
    """Initialize pgvector extension and create indexes"""
    
    app_logger.info("Initializing pgvector extension...")
    
    async with AsyncSessionLocal() as session:
        try:
            # Check if pgvector is installed
            is_installed = await vector_db.check_extension(session)
            
            if not is_installed:
                app_logger.info("pgvector extension not found, installing...")
                success = await vector_db.initialize_extension(session)
                if not success:
                    app_logger.error("Failed to install pgvector extension")
                    return False
                app_logger.info("pgvector extension installed successfully")
            else:
                app_logger.info("pgvector extension is already installed")
            
            # Create vector indexes for memories table
            app_logger.info("Creating vector indexes for memories table...")
            
            # IVFFlat index - good balance of speed and accuracy
            ivfflat_success = await vector_db.create_vector_index(
                session=session,
                table_name="memories",
                column_name="embedding",
                index_name="idx_memory_embedding_ivfflat",
                index_type="ivfflat",
                lists=100,
            )
            
            if ivfflat_success:
                app_logger.info("IVFFlat index created successfully")
            else:
                app_logger.warning("Failed to create IVFFlat index (may already exist)")
            
            # HNSW index - higher accuracy, slower build (optional)
            # Uncomment if you need higher accuracy
            # hnsw_success = await vector_db.create_vector_index(
            #     session=session,
            #     table_name="memories",
            #     column_name="embedding",
            #     index_name="idx_memory_embedding_hnsw",
            #     index_type="hnsw",
            # )
            
            # if hnsw_success:
            #     app_logger.info("HNSW index created successfully")
            
            app_logger.info("pgvector initialization completed!")
            return True
            
        except Exception as e:
            app_logger.error(f"Error initializing pgvector: {e}")
            await session.rollback()
            return False


async def verify_setup():
    """Verify pgvector is properly set up"""
    
    app_logger.info("Verifying pgvector setup...")
    
    async with AsyncSessionLocal() as session:
        try:
            # Check extension
            result = await session.execute(
                text("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
            )
            version = result.scalar()
            
            if version:
                app_logger.info(f"pgvector extension version: {version}")
            else:
                app_logger.error("pgvector extension not found!")
                return False
            
            # Check indexes
            result = await session.execute(text("""
                SELECT indexname, indexdef 
                FROM pg_indexes 
                WHERE tablename = 'memories' 
                AND indexname LIKE 'idx_memory_embedding%'
            """))
            indexes = result.fetchall()
            
            if indexes:
                app_logger.info(f"Found {len(indexes)} vector index(es):")
                for idx in indexes:
                    app_logger.info(f"  - {idx[0]}")
            else:
                app_logger.warning("No vector indexes found!")
            
            return True
            
        except Exception as e:
            app_logger.error(f"Error verifying pgvector setup: {e}")
            return False


def print_usage():
    """Print usage information"""
    print("""
pgvector Initialization Script

Usage:
    python scripts/init_pgvector.py [command]

Commands:
    init      Initialize pgvector extension and create indexes (default)
    verify    Verify pgvector is properly set up
    full      Run init and then verify

Examples:
    python scripts/init_pgvector.py
    python scripts/init_pgvector.py init
    python scripts/init_pgvector.py verify
    python scripts/init_pgvector.py full
""")


async def main():
    """Main entry point"""
    
    # Parse command
    command = sys.argv[1] if len(sys.argv) > 1 else "init"
    
    if command in ["-h", "--help", "help"]:
        print_usage()
        return
    
    if command == "init":
        success = await init_pgvector()
        sys.exit(0 if success else 1)
        
    elif command == "verify":
        success = await verify_setup()
        sys.exit(0 if success else 1)
        
    elif command == "full":
        init_success = await init_pgvector()
        if init_success:
            verify_success = await verify_setup()
            sys.exit(0 if verify_success else 1)
        else:
            sys.exit(1)
    else:
        print(f"Unknown command: {command}")
        print_usage()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
