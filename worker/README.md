# GPU PaaS Mini - Worker

Background job worker using BullMQ for processing GPU inference jobs.

## Overview

The worker listens to the `gpu-jobs` queue via Redis and processes jobs by:
1. Updating job status to `RUNNING` in the database
2. Simulating GPU compute (2-5 seconds)
3. Generating simulated output with token usage
4. Updating job status to `SUCCEEDED` or `FAILED`

## Prerequisites

- Node.js (see `.nvmrc` in root for version)
- PostgreSQL database (same as backend)
- Redis server running
- Prisma client generated (shared with backend)

## Setup

1. Install dependencies from the workspace root:

```bash
pnpm install
```

2. Create `.env` file in the `worker/` directory:

```bash
cd worker
cp .env.example .env
```

Edit `.env` and ensure the values match your setup:
- `DATABASE_URL`: Same PostgreSQL URL as backend
- `REDIS_URL`: Redis connection string (default: redis://localhost:6379)

3. Ensure Prisma client is generated (from backend):

```bash
cd ../backend
npx prisma generate
```

The worker uses the same `@prisma/client` as the backend.

## Running the Worker

### Development mode (with auto-reload):

```bash
pnpm run dev
```

### Production mode:

```bash
# Build TypeScript
pnpm run build

# Run compiled JavaScript
pnpm run start
```

## Worker Behavior

When a job is enqueued:

1. **QUEUED → RUNNING**: Worker picks up the job and sets `startedAt`
2. **Simulated compute**: Sleeps for 2-5 seconds (random)
3. **Generate output**: Creates JSON with:
   - `message`: "simulated response"
   - `jobId`: The job ID
   - `tokensUsed`: Random number between 50-200
4. **RUNNING → SUCCEEDED**: Updates `outputJson` and sets `finishedAt`

On error, the job transitions to **FAILED** with error message stored.

## Console Output

The worker logs each state transition:

```
[Worker] GPU jobs worker started. Listening on queue: gpu-jobs
[Worker] Processing job abc123...
[Worker] Job abc123 status: RUNNING
[Worker] Job abc123 status: SUCCEEDED (127 tokens, 3456ms)
[Worker] ✓ Job abc123 completed
```

## Configuration

- **Concurrency**: Worker processes up to 5 jobs concurrently (configurable in `src/index.ts`)
- **Queue name**: `gpu-jobs` (must match backend queue)
- **Retry logic**: Handled by BullMQ (can be configured)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://admin@localhost:5432/gpu_paas_mini` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |

## Graceful Shutdown

The worker handles `SIGINT` and `SIGTERM` signals for graceful shutdown:
- Stops accepting new jobs
- Waits for active jobs to complete
- Closes Redis and Prisma connections
- Press `Ctrl+C` to trigger shutdown

## Testing

To test the worker:

1. Start Redis and PostgreSQL
2. Start the backend API server
3. Start the worker (`pnpm run dev`)
4. Create an API key via the backend
5. Submit a job via the backend API:

```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "deploymentId": "optional-deployment-id",
    "inputJson": { "prompt": "Hello world" }
  }'
```

6. Watch the worker console for status transitions
7. Query the job status via the backend API:

```bash
curl http://localhost:3001/api/jobs/JOB_ID \
  -H "x-api-key: YOUR_API_KEY"
```

## Architecture

```
Backend API → BullMQ → Redis → Worker
     ↓                           ↓
  Postgres ← ← ← ← ← ← ← ← ← Postgres
```

- Backend enqueues jobs in Redis/BullMQ
- Worker processes jobs from the queue
- Both share the same PostgreSQL database for job state
