import requests
import json

try:
    response = requests.get("http://localhost:8000/api/v1/articles/popular")
    print(f"Status: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Content: {response.text}")

    if response.status_code == 200:
        data = response.json()
        print(f"\nParsed JSON contains {len(data)} articles")
        for article in data:
            print(f"  - {article.get('title')} (id={article.get('id')})")
except Exception as e:
    print(f"Error: {e}")
