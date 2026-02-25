"""
Create prompts table directly via raw SQL
"""
import sys
sys.path.insert(0, 'e:/project/my-awesome-blog/backend')

from app.core.database import SessionLocal, engine
from app.models.prompt import Prompt
from app.models.user import User
import uuid

def create_prompts_table():
    from sqlalchemy import text
    
    with engine.connect() as conn:
        try:
            result = conn.execute(text("SELECT to_regclass('public.prompts')"))
            table_exists = result.scalar() is not None
            print(f"Prompts table exists: {table_exists}")
            
            if not table_exists:
                print("Creating prompts table...")
                conn.execute(text("""
                    CREATE TABLE prompts (
                        id UUID NOT NULL,
                        tenant_id UUID NOT NULL,
                        name VARCHAR(100) NOT NULL,
                        version VARCHAR(20) NOT NULL,
                        content TEXT NOT NULL,
                        variables JSON,
                        description VARCHAR(500),
                        category VARCHAR(50),
                        is_active BOOLEAN DEFAULT TRUE,
                        is_system BOOLEAN DEFAULT FALSE,
                        ab_test_group VARCHAR(20),
                        ab_test_percentage INTEGER DEFAULT 50,
                        usage_count INTEGER DEFAULT 0,
                        success_rate INTEGER DEFAULT 0,
                        total_interactions INTEGER DEFAULT 0,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE,
                        PRIMARY KEY (id)
                    )
                """))
                
                conn.execute(text("CREATE INDEX idx_prompt_tenant ON prompts(tenant_id)"))
                conn.execute(text("CREATE INDEX idx_prompt_name ON prompts(name)"))
                conn.execute(text("CREATE INDEX idx_prompt_version ON prompts(version)"))
                conn.execute(text("CREATE INDEX idx_prompt_active ON prompts(is_active)"))
                conn.execute(text("CREATE INDEX idx_prompt_ab_test ON prompts(ab_test_group)"))
                conn.execute(text("CREATE INDEX idx_prompt_created ON prompts(created_at)"))
                conn.execute(text("CREATE INDEX ix_prompts_id ON prompts(id)"))
                
                conn.execute(text("""
                    ALTER TABLE prompts 
                    ADD CONSTRAINT fk_prompts_tenant 
                    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
                """))
                
                conn.commit()
                print("Prompts table created successfully!")
        except Exception as e:
            print(f"Error: {e}")
            conn.rollback()
            raise

def create_prompt():
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("Admin user not found!")
            return
        
        print(f"Admin user found: {admin_user.username}")
        print(f"Admin tenant_id: {admin_user.tenant_id}")
        
        prompt_content = """You are an expert problem-solving assistant with extensive knowledge across multiple domains. Your role is to help users analyze and solve daily life problems systematically.

## Core Principles

1. **Structured Analysis**: Break down complex problems into manageable components
2. **Root Cause Identification**: Dig deeper to find underlying causes, not just symptoms
3. **Multiple Perspectives**: Consider various viewpoints and stakeholder interests
4. **Actionable Solutions**: Provide practical, implementable recommendations
5. **Risk Assessment**: Identify potential obstacles and mitigation strategies

## Problem-Solving Framework

When approaching any problem, follow this systematic process:

### Step 1: Problem Definition
- Clearly state the problem in specific terms
- Identify the scope and boundaries
- Determine what success looks like

### Step 2: Information Gathering
- List known facts and available data
- Identify information gaps
- Consider what additional context might be needed

### Step 3: Analysis
- Examine cause-and-effect relationships
- Identify patterns and trends
- Consider constraints and limitations

### Step 4: Solution Generation
- Brainstorm multiple possible solutions
- Evaluate pros and cons of each option
- Consider resource requirements and feasibility

### Step 5: Recommendation
- Present the best solution with clear reasoning
- Provide implementation steps
- Include contingency plans

## Response Format

For each problem presented:

1. **Problem Summary**: Brief restatement of the issue
2. **Key Factors**: Main elements influencing the situation
3. **Analysis**: Deep dive into the problem dynamics
4. **Options**: 2-3 possible approaches with trade-offs
5. **Recommendation**: Best path forward with justification
6. **Action Items**: Concrete next steps to take
7. **Potential Challenges**: Anticipated obstacles and how to handle them

## Communication Style

- Be empathetic and understanding
- Use clear, jargon-free language
- Provide specific examples when helpful
- Ask clarifying questions when needed
- Acknowledge uncertainty when appropriate
- Maintain a constructive, solution-focused tone

Remember: Every problem is an opportunity for learning and improvement. Help users not just solve their immediate issue, but develop better problem-solving skills for the future."""
        
        new_prompt = Prompt(
            id=uuid.uuid4(),
            tenant_id=admin_user.tenant_id,
            name="Daily Problem Solver",
            version="1.0.0",
            content=prompt_content,
            description="A comprehensive prompt for systematically analyzing and solving daily life problems with structured thinking and actionable recommendations",
            category="problem-solving",
            is_system=False,
            is_active=True,
            usage_count=0,
            success_rate=0,
            total_interactions=0
        )
        
        db.add(new_prompt)
        db.commit()
        db.refresh(new_prompt)
        
        print(f"\nPrompt created successfully!")
        print(f"ID: {new_prompt.id}")
        print(f"Name: {new_prompt.name}")
        print(f"Version: {new_prompt.version}")
        print(f"Category: {new_prompt.category}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_prompts_table()
    create_prompt()
