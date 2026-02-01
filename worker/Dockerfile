FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Note: Prisma schema will be mounted from backend via docker-compose volume
# Generate Prisma client at startup (prisma is already installed from npm install)
CMD ["sh", "-c", "./node_modules/.bin/prisma generate && npm run dev"]
