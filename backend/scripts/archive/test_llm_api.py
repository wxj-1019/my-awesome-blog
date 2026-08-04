import requests
import json

response = requests.get('http://localhost:8989/api/v1/llm/models')
print(f'Status: {response.status_code}')
print(f'Headers: {dict(response.headers)}')
print(f'Content: {json.dumps(response.json(), indent=2, ensure_ascii=False)}')
