FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy prisma schema first for better caching
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose backend port
EXPOSE 3001

# Run migrations and start dev server
# Remove dist folder if it exists to prevent EBUSY errors
CMD ["sh", "-c", "rm -rf /app/dist && npx prisma migrate deploy && pnpm run start:dev"]
