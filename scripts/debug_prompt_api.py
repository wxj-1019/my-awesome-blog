"""
Debug prompt API - detailed error tracing
"""
import sys
sys.path.insert(0, 'e:/project/my-awesome-blog/backend')

from app.core.database import SessionLocal
from app.crud import prompt as prompt_crud
from app.services.prompt_service import prompt_service
from app.schemas.prompt import PromptListResponse
from uuid import UUID

def debug_get_prompts():
    db = SessionLocal()
    try:
        from app.models.user import User
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("Admin user not found!")
            return
        
        tenant_id = str(admin_user.tenant_id)
        print(f"Testing with tenant_id: {tenant_id}")
        
        print("\n1. Testing prompt_crud.get_prompts...")
        try:
            prompts = prompt_crud.get_prompts(db, tenant_id)
            print(f"   Found {len(prompts)} prompts")
            for p in prompts:
                print(f"   - {p.id}: {p.name}")
        except Exception as e:
            print(f"   ERROR: {e}")
            import traceback
            traceback.print_exc()
        
        print("\n2. Testing prompt_crud.count_prompts...")
        try:
            count = prompt_crud.count_prompts(db, tenant_id)
            print(f"   Count: {count}")
        except Exception as e:
            print(f"   ERROR: {e}")
            import traceback
            traceback.print_exc()
        
        print("\n3. Testing prompt_service.get_prompts...")
        try:
            result = prompt_service.get_prompts(db, tenant_id)
            print(f"   Result: {result}")
            print(f"   Total: {result.total}")
            print(f"   Prompts count: {len(result.prompts)}")
        except Exception as e:
            print(f"   ERROR: {e}")
            import traceback
            traceback.print_exc()
        
        print("\n4. Testing PromptListResponse serialization...")
        try:
            prompts = prompt_crud.get_prompts(db, tenant_id)
            count = prompt_crud.count_prompts(db, tenant_id)
            response = PromptListResponse(
                prompts=prompts,
                total=count,
                page=1,
                page_size=100
            )
            print(f"   Response created successfully")
            json_data = response.model_dump_json()
            print(f"   JSON: {json_data[:500]}...")
        except Exception as e:
            print(f"   ERROR: {e}")
            import traceback
            traceback.print_exc()
            
    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_get_prompts()
