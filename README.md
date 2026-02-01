# GPU PaaS Mini

A production-ready GPU Platform-as-a-Service mini application with real-time job monitoring, deployment management, and usage tracking.

Video Recording: https://drive.google.com/file/d/1VqzVt8sum6BClS-zpgrBtBFIoriXhaMA/view?usp=sharing

## 📚 Documentation

- **[Getting Started](#getting-started)** - Quick setup and running locally

## Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Cache/Queue**: Redis 6+ with BullMQ
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator + class-transformer
- **Testing**: Jest + @nestjs/testing

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit + RTK Query
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Real-time**: Server-Sent Events (SSE) with custom client
- **Testing**: Vitest + React Testing Library

### Worker
- **Runtime**: Node.js with TypeScript
- **Queue**: BullMQ (Redis-backed)
- **Job Processing**: Async event-driven architecture

## Getting Started

## Running with Docker (Recommended)

The easiest way to run the entire application is using Docker Compose. This eliminates the need to install PostgreSQL and Redis locally.

### Prerequisites for Docker

- **Docker**: v20+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: v2+ (included with Docker Desktop)

### Quick Start

**One command to start everything:**

```bash
docker-compose up
```

This will:
- Start PostgreSQL and Redis containers
- Run database migrations automatically
- Start backend API (http://localhost:3001)
- Start worker process
- Start frontend dev server (http://localhost:5173)

### Access Services

All services are accessible on `localhost` just like running locally:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/docs
- **PostgreSQL**: `localhost:5432` (connect with pgAdmin, DBeaver, etc.)
  - User: `postgres`
  - Password: `password`
  - Database: `gpu_paas_mini`
- **Redis**: `localhost:6379` (connect with redis-cli or RedisInsight)
- **Prisma Studio**: `docker-compose exec backend npx prisma studio`

### Common Docker Commands

```bash
# Start in background (detached mode)
docker-compose up -d

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f worker
docker-compose logs -f frontend

# Rebuild after dependency changes
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes (fresh database)
docker-compose down -v

# Run Prisma Studio
docker-compose exec backend npx prisma studio

# Access backend shell
docker-compose exec backend sh

# Run backend tests
docker-compose exec backend pnpm test
```

### Hot Reload

Code changes are automatically detected:
- **Backend**: NestJS watch mode recompiles TypeScript
- **Frontend**: Vite HMR (Hot Module Replacement)
- **Worker**: tsx watch mode restarts on changes

No need to rebuild containers for code changes!

### Troubleshooting Docker Setup

**Port conflicts:**
If ports 3001, 5173, 5432, or 6379 are already in use, stop the conflicting services or modify the ports in `docker-compose.yml`.

**Slow performance on macOS:**
Docker volume mounts can be slow on macOS. Consider using named volumes for `node_modules` (already configured).

**Database connection errors:**
Wait for health checks to pass. Backend and worker wait for PostgreSQL to be ready before starting.

**Fresh start:**
```bash
docker-compose down -v  # Remove volumes
docker-compose up --build  # Rebuild and start
```

---

## Manual Setup (Without Docker)

If you prefer to run services manually without Docker, follow these instructions:

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js**: v18+ (see `.nvmrc` for exact version)
- **pnpm**: v8+ (package manager)
  ```bash
  npm install -g pnpm
  ```
- **PostgreSQL**: v14+ (database)
  - Running on default port `5432`
  - Create a database named `gpu_paas_mini`
- **Redis**: v6+ (for job queue)
  - Running on default port `6379`

### Ports Used

- Backend API: `3001`
- Frontend Dev Server: `5173`
- PostgreSQL: `5432`
- Redis: `6379`

## Setup

### 1. Install Dependencies

From the root directory:

```bash
# Install all workspace dependencies
pnpm install
```

### 2. Backend Setup

#### Environment Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your database and Redis URLs:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gpu_paas_mini"
REDIS_URL="redis://localhost:6379"
PORT=3001
```

#### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 3. Worker Setup

The worker processes background jobs from the queue.

```bash
cd worker
cp .env.example .env
```

Edit `worker/.env` with the same database and Redis URLs:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gpu_paas_mini"
REDIS_URL="redis://localhost:6379"
```

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env
```

The default configuration should work:

```env
VITE_API_BASE_URL=http://localhost:3001
```

## Running the Application

You need **three terminal windows** to run all components:

### Terminal 1: Backend API

```bash
cd backend
pnpm run start:dev
```

The API will be available at `http://localhost:3001`  
Swagger docs at `http://localhost:3001/docs`

### Terminal 2: Worker Process

```bash
cd worker
pnpm run dev
```

The worker will process jobs from the Redis queue.

### Terminal 3: Frontend

```bash
cd frontend
pnpm run dev
```

The frontend will be available at `http://localhost:5173`

## Demo Script (3-5 minutes)

Follow these steps to see all features in action:

### Step 1: Create an API Key

1. Open `http://localhost:5173` in your browser
2. Navigate to **"API Keys"** page
3. Click **"+ Create API Key"**
4. Enter a name (e.g., "Demo Key")
5. **Important**: Copy the plaintext API key from the modal (shown only once!)
6. The key will look like: `3a6693e295523843e430678d3d85b2...`

**What you should see**: A table showing your new API key with status "Active"

### Step 2: Connect with API Key

1. In the top navigation bar, find the **"API Key:"** input field
2. Paste your copied API key
3. Wait ~600ms for debounce (the app will verify the key)
4. Status indicator should change to **"✓ Connected"** (green)

**What you should see**: 
- Status changes from "⟳ Checking..." to "✓ Connected"
- No auth warning banner appears

### Step 3: Create and Activate a Deployment

1. Navigate to **"Deployments"** page
2. Click **"+ Create Deployment"**
3. Enter deployment details:
   - Model Name: `llama-3-8b`
   - Configuration JSON:
     ```json
     {
       "gpu": "A100",
       "memory": "16GB",
       "replicas": 2
     }
     ```
4. Click **"Create Deployment"**
5. Once created, click **"Activate"** on your deployment
6. Confirm the activation dialog

**What you should see**:
- New deployment appears in table
- Status badge changes from "Inactive" to "Active" (green)
- Other deployments (if any) become "Inactive"

### Step 4: Create a Job and Watch Live Updates

1. Navigate to **"Jobs"** page
2. Click **"+ Create Job"**
3. Fill in the job form:
   - Deployment: Select your `llama-3-8b` deployment
   - Input JSON:
     ```json
     {
       "prompt": "Hello, world!",
       "max_tokens": 100
     }
     ```
   - Leave timeout/retry settings as defaults
4. Click **"Create Job"**
5. The job details drawer will **automatically open**
6. **Watch the magic happen**:
   - Status changes: `QUEUED` → `RUNNING` → `SUCCEEDED`
   - Live events timeline updates in real-time (via Server-Sent Events)
   - Output JSON appears when job completes

**What you should see**:
- Job details drawer slides in from the right
- Connection status shows "● Connected" (green dot)
- Events appear with timestamps as job progresses
- After ~10 seconds, job completes with status "SUCCEEDED"
- Output JSON is displayed
- SSE connection auto-closes on completion

### Step 5: Monitor Usage

1. Navigate to **"Usage"** page
2. View the summary cards showing:
   - **Total Requests**: All API calls in last hour
   - **Success Rate**: Percentage with success/error breakdown
   - **Avg Latency**: Average response time
   - **P95 Latency**: 95th percentile latency
3. Check the **Recent Events** table:
   - See your API calls (deployments, jobs)
   - Color-coded HTTP methods (GET=green, POST=blue)
   - Status codes (200=green, 4xx=orange, 5xx=red)
4. Try the filters:
   - Filter by endpoint (e.g., `/api/jobs`)
   - Filter by API key

**What you should see**:
- Summary metrics reflecting your activity
- Events table showing your recent actions
- Metrics update in real-time (polls every 30s)

### Step 6: Test Error Scenarios (Optional)

**Test Invalid API Key:**
1. Go to "API Keys" page
2. Click **"Revoke"** on your active key
3. Confirm revocation
4. Notice top banner: "⚠️ Invalid API key. Please set a valid key..."
5. Try to create a deployment → button is **disabled**
6. Create a new API key and paste it in top nav to restore access

**Test Job Cancellation:**
1. Create a new job (Steps 4.1-4.4)
2. While job is `RUNNING`, click **"Cancel Job"** in job details
3. Confirm cancellation
4. Watch status change to `CANCELLED`

## Features Overview

### API Keys Management
- Create named API keys
- One-time plaintext display (SHA-256 hashed in database)
- Revoke keys
- Real-time connection status validation

### Deployments Management
- Create deployments with JSON configuration
- Activate/deactivate deployments (only one active at a time)
- View configuration with expandable JSON viewer

### Jobs Management
- Create background jobs with configuration (timeout, retries)
- **Real-time updates** via Server-Sent Events (SSE)
- Live events timeline with status transitions
- Job cancellation (for QUEUED/RUNNING jobs)
- View input/output JSON and error messages
- Retry configuration with exponential backoff

### Usage Monitoring
- In-memory tracking (last 1000 events)
- Summary metrics (total, success rate, latencies)
- P95 latency calculation
- Filter by endpoint or API key
- Events table with detailed request information

## Authentication & Security

### Backend
- Dual authentication: `x-api-key` header (primary) or `Authorization: Bearer <key>` (secondary)
- Global API key guard on protected routes
- Consistent error responses with codes:
  - `API_KEY_MISSING` - No API key provided
  - `API_KEY_INVALID` - Invalid or revoked key
  - `VALIDATION_ERROR` - Invalid request payload
  - `NOT_FOUND` - Resource not found
  - `CONFLICT` - Resource conflict

### Frontend
- API key stored in Redux + localStorage
- Real connection check with 600ms debounce
- Automatic `x-api-key` header attachment
- Auth error banner when key is invalid
- Disabled actions when not connected
- Consistent error display patterns

## Development

### Linting & Type Checking

```bash
# Backend
cd backend
pnpm run lint

# Frontend
cd frontend
pnpm run lint
pnpm run type-check
```

### Database Management

```bash
# View database in Prisma Studio
cd backend
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: destroys all data)
npx prisma migrate reset
```

## Testing

The project includes comprehensive unit and integration tests for both frontend and backend.

### Prerequisites

Install all dependencies first:

```bash
# From root directory
pnpm install
```

### Running Tests

**Run all tests (frontend + backend):**
```bash
pnpm test
```

**Run tests with coverage:**
```bash
pnpm test:coverage
```

**Run tests in watch mode:**
```bash
pnpm test:watch
```

**Run tests for specific package:**
```bash
# Frontend only
pnpm --filter frontend test

# Backend only
pnpm --filter backend test
```

### Frontend Tests (Vitest)

Frontend tests use **Vitest** with React Testing Library:

```bash
cd frontend

# Run tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

**Test files location:** `frontend/src/tests/`

**What's tested:**
- Utility functions (error normalizer, SSE client)
- Redux slices and store logic
- Custom hooks
- Component behavior (not UI styling)

**Framework:** Vitest + @testing-library/react + jsdom

### Backend Tests (Jest)

Backend tests use **Jest** with NestJS testing utilities:

```bash
cd backend

# Run tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

**Test files location:** `backend/src/tests/`

**What's tested:**
- Service layer business logic
- API endpoint behavior
- Database interactions (mocked)
- Error handling and validation

**Framework:** Jest + @nestjs/testing + supertest

### Coverage Reports

After running `pnpm test:coverage`, coverage reports are generated:

- **Frontend:** `frontend/coverage/`
- **Backend:** `backend/coverage/`

Open `coverage/index.html` in your browser to view detailed coverage reports.

### Writing Tests

**Frontend example (`frontend/src/tests/utils/example.test.ts`):**
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../utils/example';

describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

**Backend example (`backend/src/tests/module/service.test.ts`):**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from '../../module/my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### Test Guidelines

- **Location:** All tests must be in `src/tests/` directory
- **Naming:** Use `.test.ts` or `.test.tsx` suffix
- **No UI testing:** Tests focus on logic, not Tailwind styling
- **Mock external dependencies:** Database, Redis, HTTP calls
- **Deterministic:** Tests should pass consistently
- **Fast:** Keep tests fast and focused

### CI/CD Integration

To integrate with CI/CD pipelines:

```bash
# Run tests with coverage in CI
pnpm test:coverage

# Check exit code
echo $?  # Should be 0 if all tests pass
```

### Troubleshooting Tests

**Frontend tests fail:**
- Ensure `jsdom` is installed
- Check setup file: `frontend/src/tests/setup.ts`
- Verify imports use correct paths

**Backend tests fail:**
- Ensure all NestJS testing packages are installed
- Check Jest config in `backend/package.json`
- Verify mocks are properly configured

**Coverage not generated:**
- Run `pnpm test:coverage` instead of `pnpm test`
- Check `.gitignore` doesn't block coverage directory

## Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running: `pg_isready`
- Check database connection in `.env`
- Run migrations: `npx prisma migrate dev`

### Worker not processing jobs
- Ensure Redis is running: `redis-cli ping` (should return `PONG`)
- Check Redis URL in `worker/.env`
- Check worker logs for errors

### Frontend shows "Not connected"
- Verify backend is running on port 3001
- Check browser console for CORS errors
- Ensure API key is valid and not revoked
- Wait ~600ms after entering key (debounce delay)

### Jobs stuck in QUEUED
- Ensure worker process is running
- Check worker logs: `cd worker && pnpm run dev`
- Verify Redis connection

### Usage metrics show no data
- Usage tracking is **in-memory** and resets on backend restart
- Generate some traffic first (create deployments, jobs)
- Usage API endpoints (`/api/usage/*`) are **not tracked** (prevents recursive logging)

## Project Structure

```
gpu-paas-mini/
├── backend/               # NestJS API
│   ├── src/
│   │   ├── api-keys/     # API key management
│   │   ├── deployments/  # Deployment CRUD
│   │   ├── jobs/         # Job management + SSE
│   │   ├── queue/        # BullMQ service
│   │   ├── usage/        # Usage tracking
│   │   ├── health/       # Health check
│   │   ├── common/       # Guards, filters, decorators
│   │   └── prisma/       # Database service
│   └── prisma/           # Database schema & migrations
├── worker/               # Background job processor
│   └── src/index.ts     # Job execution logic
└── frontend/            # React dashboard
    └── src/
        ├── pages/       # Page components
        ├── components/  # Reusable components
        ├── store/       # Redux + RTK Query
        ├── utils/       # SSE client, error normalizer
        └── hooks/       # Custom hooks

```

## Notes

- **Usage data is ephemeral**: Stored in memory, resets on backend restart
- **SSE requires custom client**: Native `EventSource` doesn't support headers
- **API key shown once**: Store it securely after creation
- **One active deployment**: Activating one deactivates all others
- **Job timeout**: Default 60 seconds, configurable 1-600 seconds
- **Retry logic**: Exponential backoff with jitter for transient failures

## API Documentation

Full API documentation available at: `http://localhost:3001/docs` (Swagger UI)

## License

MIT

---

**Auth & Error Handling Implementation Summary:**

- **Backend**: API key guard in `src/common/guards/api-key.guard.ts` supports dual auth. Global exception filter in `src/common/filters/http-exception.filter.ts` ensures consistent error format `{message, code, details?, requestId?}`.
  
- **Frontend**: Error normalizer in `src/utils/errorNormalizer.ts` handles all error shapes. Connection check with debouncing in `src/components/Layout.tsx`. Auth banner appears on invalid key. Actions disabled via `useConnectionStatus()` hook checking `isConnected` from outlet context.
