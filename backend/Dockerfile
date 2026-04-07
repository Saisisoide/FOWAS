FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway injects PORT at runtime. Default to 8000 for local Docker.
ENV PORT=8000

# MUST use shell form (not exec form) so $PORT expands at runtime
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
