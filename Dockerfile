# Use Node.js 18 as base image
FROM node:18-bullseye

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm ci --only=production
RUN cd backend && npm ci --only=production

# Install Python dependencies
RUN python3 -m pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers (headless versions)
RUN python3 -m playwright install chromium
RUN python3 -m playwright install-deps chromium

# Copy application code
COPY . .

# Set environment variables for production
ENV NODE_ENV=production
ENV RENDER=true

# Expose port
EXPOSE 5000

# Start the backend server
CMD ["npm", "start", "--prefix", "backend"] 