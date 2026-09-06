# Production Dockerfile for judge-service on Render (Build context: repo root)
FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install C++ (GCC), Python 3, and Java (OpenJDK 17) runtimes
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    openjdk-17-jdk-headless \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install judge-service dependencies
COPY judge-service/package*.json ./
RUN npm install --production

# Copy judge-service source code
COPY judge-service/ .

# Copy problem testcases into container
COPY storage/ ./storage/

ENV NODE_ENV=production
ENV USE_DOCKER=false
ENV STORAGE_PATH=/app/storage

CMD ["node", "src/worker.js"]

