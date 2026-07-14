FROM python:3.12-slim

# Create non-root user early
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Clear injected proxy env vars (host 127.0.0.1:7890 unreachable from container)
ENV HTTP_PROXY="" HTTPS_PROXY="" http_proxy="" https_proxy=""

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements first for better caching
COPY --chown=appuser:appuser requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    rm requirements.txt

# Copy application code
COPY --chown=appuser:appuser . .

# Create logs directory and fix all permissions for appuser
RUN mkdir -p logs && chown -R appuser:appuser /app

USER appuser

# Expose port 8989 (根据项目规范)
EXPOSE 8989

# Health check - 使用正确的端口
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:8989/health || exit 1

# Run the application - 使用端口 8989, python -m 避免 PATH 问题
CMD ["sh", "-c", "python -c 'from app.utils.security_utils import generate_secret_key; print(\"SECRET_KEY:\", generate_secret_key(64))' && exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8989"]
