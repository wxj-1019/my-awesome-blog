"""
Test prompt API directly
"""
import sys
sys.path.insert(0, 'e:/project/my-awesome-blog/backend')

from app.core.database import SessionLocal
from app.models.prompt import Prompt
from app.schemas.prompt import Prompt as PromptSchema
from uuid import UUID

def test_prompt_schema():
    db = SessionLocal()
    try:
        prompts = db.query(Prompt).all()
        print(f"Found {len(prompts)} prompts in database")
        
        for p in prompts:
            print(f"\n--- Prompt from DB ---")
            print(f"ID: {p.id} (type: {type(p.id)})")
            print(f"Tenant ID: {p.tenant_id} (type: {type(p.tenant_id)})")
            print(f"Name: {p.name}")
            print(f"Version: {p.version}")
            print(f"Is Active: {p.is_active}")
            print(f"Variables: {p.variables} (type: {type(p.variables)})")
            
            try:
                schema = PromptSchema.model_validate(p)
                print(f"\n--- Schema Validation Success ---")
                print(f"Schema ID: {schema.id}")
                print(f"Schema tenant_id: {schema.tenant_id}")
                
                json_data = schema.model_dump_json()
                print(f"\n--- JSON Output ---")
                print(f"JSON: {json_data[:500]}...")
            except Exception as e:
                print(f"\n--- Schema Validation Error ---")
                print(f"Error: {e}")
                import traceback
                traceback.print_exc()
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_prompt_schema()
