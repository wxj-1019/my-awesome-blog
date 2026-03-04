import secrets

secret_key = secrets.token_hex(32)
postgres_password = secrets.token_urlsafe(16)

print(f"SECRET_KEY={secret_key}")
print(f"POSTGRES_PASSWORD={postgres_password}")
