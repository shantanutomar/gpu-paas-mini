# GPU PaaS Mini - Backend

NestJS backend service for managing GPU deployments and API keys.

## Setup

### Prerequisites

- Node.js (see `.nvmrc` in root for version)
- PostgreSQL database running
- Redis server running
- pnpm package manager

### Installation

1. Install dependencies from the workspace root:

```bash
pnpm install
```

2. Create `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` and update `DATABASE_URL` and `REDIS_URL` if needed.

3. Generate Prisma client and run migrations:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### Running the Application

Development mode:

```bash
pnpm run start:dev
```

Production mode:

```bash
pnpm run build
pnpm run start:prod
```

The API will be available at `http://localhost:3001`

Swagger documentation: `http://localhost:3001/docs`

## API Endpoints

### Health Check

```bash
# Check service health
curl http://localhost:3001/health
```

### API Keys

```bash
# Create an API key
curl -X POST http://localhost:3001/api/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name": "My API Key"}'

# Response includes the plaintext key (only shown once!)
# {
#   "id": "...",
#   "name": "My API Key",
#   "key": "abc123...",
#   "createdAt": "...",
#   "revokedAt": null
# }

# List all API keys
curl http://localhost:3001/api/api-keys

# Revoke an API key
curl -X POST http://localhost:3001/api/api-keys/{id}/revoke
```

### Deployments

All deployment endpoints require authentication via `x-api-key` header.

```bash
# Create a deployment
curl -X POST http://localhost:3001/api/deployments \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "modelName": "llama-3-8b",
    "configJson": {
      "gpu": "A100",
      "memory": "16GB",
      "replicas": 2
    }
  }'

# List all deployments
curl http://localhost:3001/api/deployments \
  -H "x-api-key: YOUR_API_KEY_HERE"

# Activate a deployment (deactivates all others)
curl -X POST http://localhost:3001/api/deployments/{id}/activate \
  -H "x-api-key: YOUR_API_KEY_HERE"
```

### Jobs

All job endpoints require authentication via `x-api-key` header.

```bash
# Create a job (enqueues it in Redis for worker processing)
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "deploymentId": "optional-deployment-id",
    "inputJson": {
      "prompt": "Hello, world!",
      "max_tokens": 100
    },
    "timeoutMs": 60000,
    "maxAttempts": 3,
    "retryDelayMs": 1000
  }'

# Create a job with idempotency key (prevents duplicates)
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -H "idempotency-key: unique-request-id-123" \
  -d '{
    "inputJson": {"prompt": "Test"}
  }'

# Response:
# {
#   "id": "job-uuid",
#   "status": "QUEUED",
#   "createdAt": "...",
#   "timeoutMs": 60000,
#   "attempt": 1,
#   "maxAttempts": 3,
#   ...
# }

# Get a specific job by ID
curl http://localhost:3001/api/jobs/{id} \
  -H "x-api-key: YOUR_API_KEY_HERE"

# List latest 20 jobs
curl http://localhost:3001/api/jobs \
  -H "x-api-key: YOUR_API_KEY_HERE"

# Cancel a job
curl -X POST http://localhost:3001/api/jobs/{id}/cancel \
  -H "x-api-key: YOUR_API_KEY_HERE"

# Stream job status updates via Server-Sent Events (SSE)
curl -N http://localhost:3001/api/jobs/{id}/events \
  -H "x-api-key: YOUR_API_KEY_HERE"

# Example SSE output:
# event: status
# data: {"jobId":"...","status":"QUEUED","ts":"2026-01-31T..."}
#
# event: status
# data: {"jobId":"...","status":"RUNNING","ts":"2026-01-31T..."}
#
# event: heartbeat
# data: {"type":"heartbeat","ts":"2026-01-31T..."}
#
# event: status
# data: {"jobId":"...","status":"SUCCEEDED","ts":"...","outputJson":{...}}
# (Connection closes automatically after terminal status)
```

**Job Status Flow**: `QUEUED` → `RUNNING` → `SUCCEEDED` | `FAILED` | `CANCELLED` | `TIMED_OUT`

**Production Features**:

1. **Job Cancellation**:
   - `QUEUED` jobs: Cancelled immediately, removed from queue
   - `RUNNING` jobs: Cancellation requested, worker checks periodically and aborts
   - Terminal states: Returns 409 conflict

2. **Timeouts**:
   - Default: 60 seconds (configurable via `timeoutMs`)
   - Range: 1-600 seconds
   - Worker enforces timeout and sets `TIMED_OUT` status

3. **Retries with Exponential Backoff**:
   - Configurable via `maxAttempts` (1-5, default: 1)
   - Base retry delay via `retryDelayMs` (default: 1000ms)
   - Exponential backoff: delay × 2^(attempt-1) with 10% jitter
   - Only retries on transient errors (network, timeouts, 5xx)

4. **Idempotency**:
   - Use `idempotency-key` header to prevent duplicate jobs
   - Same key with same payload: returns existing job
   - Same key with different payload: returns 409 conflict

5. **SSE Stream**: The `/api/jobs/:id/events` endpoint provides real-time job status updates:
   - Sends initial job state immediately upon connection
   - Streams subsequent status changes as they occur
   - Includes `outputJson` on SUCCEEDED and `error` on FAILED/TIMED_OUT
   - Sends heartbeat every 15 seconds to keep connection alive
   - **Auto-closes** connection when terminal state is reached
   - Automatically cleans up on client disconnect

The worker (see `worker/`) processes jobs from the Redis queue and updates their status in the database. The backend listens to BullMQ events via `QueueEvents` to stream real-time updates to SSE clients.

## Database

The application uses PostgreSQL with Prisma ORM.

### Schema Models

- **ApiKey**: Stores API keys (hashed) with revocation support
- **Deployment**: Stores model deployments with activation state
- **Job**: Stores background jobs with:
  - Status tracking: QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED, CANCEL_REQUESTED, TIMED_OUT
  - Timeout enforcement (timeoutMs)
  - Retry configuration (attempt, maxAttempts, retryDelayMs)
  - Idempotency keys for duplicate prevention

### Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Create a migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Development

### Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── api-keys/              # API Keys module
│   ├── deployments/           # Deployments module
│   ├── health/                # Health check module
│   ├── prisma/                # Prisma service
│   ├── common/                # Shared guards, decorators
│   ├── app.module.ts
│   └── main.ts
└── test/
```

### Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Security

- API keys are stored as SHA-256 hashes
- Protected routes require `x-api-key` header
- Only non-revoked keys are valid for authentication
- Use `@Public()` decorator to bypass auth on specific routes
