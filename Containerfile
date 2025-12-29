# Single stage: Ubuntu 24.04 with Python 3.13 and Node.js 22
FROM ubuntu:24.04

WORKDIR /app

# Install Python 3.13
RUN apt-get update && apt-get install -y \
    add-apt-repository ppa:deadsnakes/ppa \
    python3.13 \
    python3.13-venv \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install uv for Python dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy the entire repo (except 'node_modules')
COPY . .

# Install dependencies
RUN npm install

# Build argument for version
ARG GIT_ABR_VERSION=""
ENV GIT_ABR_VERSION=${GIT_ABR_VERSION}

# Expose the port
EXPOSE 5173

# Build and start the server
CMD ["npm", "start"]
