"""
Create a professional daily problem-solving prompt via API
"""
import requests
import json

API_BASE = "http://localhost:8989/api/v1"

def login():
    response = requests.post(
        f"{API_BASE}/auth/login",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token")
    else:
        print(f"Login failed: {response.text}")
        return None

def get_user_info(token):
    response = requests.get(
        f"{API_BASE}/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get user info: {response.text}")
        return None

def create_prompt(token):
    prompt_data = {
        "name": "Daily Problem Solver",
        "version": "1.0.0",
        "content": """You are an expert problem-solving assistant with extensive knowledge across multiple domains. Your role is to help users analyze and solve daily life problems systematically.

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

Remember: Every problem is an opportunity for learning and improvement. Help users not just solve their immediate issue, but develop better problem-solving skills for the future.""",
        "description": "A comprehensive prompt for systematically analyzing and solving daily life problems",
        "category": "problem-solving",
        "is_system": False
    }
    
    print(f"Creating prompt with data: {json.dumps(prompt_data, indent=2, ensure_ascii=False)[:500]}...")
    
    response = requests.post(
        f"{API_BASE}/prompts/",
        json=prompt_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    print(f"Response status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("Prompt created successfully!")
    else:
        print(f"Failed to create prompt")

if __name__ == "__main__":
    token = login()
    if token:
        print(f"Logged in successfully, token: {token[:30]}...")
        
        user_info = get_user_info(token)
        if user_info:
            print(f"User info: {json.dumps(user_info, indent=2, ensure_ascii=False, default=str)}")
        
        create_prompt(token)
