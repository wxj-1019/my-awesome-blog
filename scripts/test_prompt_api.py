"""
Test prompt API via HTTP request
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
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def test_get_prompts(token):
    print("\n=== Testing GET /prompts/ ===")
    response = requests.get(
        f"{API_BASE}/prompts/",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False, default=str)[:1000]}")
    return response.status_code == 200

def test_get_folders(token):
    print("\n=== Testing GET /prompts/folders ===")
    response = requests.get(
        f"{API_BASE}/prompts/folders",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False, default=str)[:1000]}")
    return response.status_code == 200

def test_get_prompt_by_id(token, prompt_id):
    print(f"\n=== Testing GET /prompts/{prompt_id} ===")
    response = requests.get(
        f"{API_BASE}/prompts/{prompt_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False, default=str)[:2000]}")
    except:
        print(f"Response (text): {response.text}")
    return response.status_code == 200

if __name__ == "__main__":
    token = login()
    if token:
        print(f"Token: {token[:30]}...")
        
        test_get_prompts(token)
        test_get_folders(token)
        
        # 测试获取特定提示词
        test_get_prompt_by_id(token, "61b53b6e-d30a-4b98-b616-0944d9796f02")
