# Alternative approach: Custom Dockerfile for Railway
# Use this if nixpacks.toml approach fails

FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend and install Node dependencies
COPY frontend/package*.json frontend/
RUN cd frontend && npm install

# Copy all source code
COPY . .

# Build React frontend
RUN cd frontend && NODE_ENV=production npm run build

# Create static directory and copy built frontend
RUN mkdir -p static/frontend && cp -r frontend/dist/* static/frontend/

# Collect Django static files
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Start command
CMD ["sh", "-c", "python manage.py migrate && gunicorn fabrikots.wsgi:application --bind 0.0.0.0:$PORT"]