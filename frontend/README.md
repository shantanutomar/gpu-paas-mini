# GPU PaaS Mini - Frontend

React + TypeScript + Vite frontend dashboard for managing GPU deployments, API keys, jobs, and monitoring usage.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast builds and HMR
- **Redux Toolkit** for state management
- **RTK Query** for API data fetching
- **React Router** for routing

## Setup

### Prerequisites

- Node.js (see `.nvmrc` in root for version)
- pnpm package manager
- Backend service running at `http://localhost:3001`

### Installation

1. Install dependencies from the workspace root:

```bash
pnpm install
```

2. Create `.env` file in the `frontend/` directory:

```bash
cp .env.example .env
```

The default configuration should work with the backend running locally:

```env
VITE_API_BASE_URL=http://localhost:3001
```

### Running the Application

Development mode:

```bash
cd frontend
pnpm run dev
```

The app will be available at `http://localhost:5173`

Production build:

```bash
pnpm run build
pnpm run preview
```

## Features

### 1. API Keys Management (`/api-keys`)

- **View all API keys**: Table showing name, ID, creation date, and status
- **Create new keys**: Modal with name input, displays plaintext key once
- **Revoke keys**: Button to revoke active keys with confirmation
- **Connection status**: Live indicator showing if current key is valid

### 2. Deployments Management (`/deployments`)

- **View deployments**: Table with model name, config, created date, status
- **Create deployment**: Modal with JSON validation for configuration
- **Activate deployment**: One-click activation (deactivates others)
- **Config preview**: Expandable JSON viewer for each deployment

### 3. Jobs Management (`/jobs`)

- **View jobs list**: Table showing latest 20 jobs with status chips
- **Job details**:
  - Job ID (copy to clipboard)
  - Status with color-coded chip
  - Input/Output JSON (pretty-formatted)
  - Error messages (if failed)
  - Attempt tracking and retry configuration
  - Timestamps (created, started, finished)
- **Create job**: Modal with:
  - Deployment selection (dropdown if deployments exist)
  - Input JSON with validation
  - Optional configuration: timeout, max attempts, retry delay
  - Auto-opens job details after creation
- **Cancel job**: Available for QUEUED and RUNNING jobs
- **Live updates**: SSE streaming with:
  - Real-time status updates
  - Custom SSE client supporting `x-api-key` header
  - Auto-reconnects on status changes
  - Auto-closes connection on terminal states
  - Event timeline with timestamps
- **Status types**: QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED, CANCEL_REQUESTED, TIMED_OUT

### 4. Usage & Monitoring (`/usage`)

- **Time range**: Fixed to last 1 hour
- **Summary cards**:
  - Total requests
  - Success rate (percentage)
  - Average latency
  - P95 latency
- **Filters**:
  - Filter by endpoint (dropdown)
  - Filter by API key (dropdown)
- **Events table**: Recent HTTP requests with:
  - Timestamp
  - Method (color-coded badges)
  - Endpoint path
  - Status code (color-coded)
  - Latency (milliseconds)
  - Masked API key ID
  - Error message (if any)
- **Auto-refresh**: Data polls every 30 seconds
- **Note**: Usage API calls (`/api/usage/*`) are not tracked to prevent recursive logging

## Architecture

### State Management

**Redux Store** (`src/store/`):

- `authSlice`: Manages API key state (persisted to localStorage)
- `apiSlice`: RTK Query API with auto-generated hooks

**API Endpoints**:

- API Keys: `useGetApiKeysQuery`, `useCreateApiKeyMutation`, `useRevokeApiKeyMutation`
- Deployments: `useGetDeploymentsQuery`, `useCreateDeploymentMutation`, `useActivateDeploymentMutation`
- Jobs: `useGetJobsQuery`, `useGetJobByIdQuery`, `useCreateJobMutation`, `useCancelJobMutation`
- Usage: `useGetUsageSummaryQuery`, `useGetUsageEventsQuery`

### Authentication

The app uses a simple API key authentication:

1. User enters API key in top navigation input
2. Key is stored in Redux state + localStorage
3. RTK Query automatically attaches `x-api-key` header to all requests
4. Connection status indicator validates key against protected endpoints

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.tsx              # Main layout with navigation
│   │   ├── ApiKeyModal.tsx         # One-time API key display
│   │   ├── CreateDeploymentModal.tsx # Deployment creation
│   │   ├── CreateJobModal.tsx      # Job creation with JSON validation
│   │   └── JobDetailsDrawer.tsx    # Job details with live SSE updates
│   ├── pages/
│   │   ├── ApiKeysPage.tsx         # API keys management
│   │   ├── DeploymentsPage.tsx     # Deployments management
│   │   ├── JobsPage.tsx            # Jobs management
│   │   └── UsagePage.tsx           # Usage monitoring
│   ├── store/
│   │   ├── store.ts                # Redux store config
│   │   ├── authSlice.ts            # Auth state
│   │   └── apiSlice.ts             # RTK Query API
│   ├── types/
│   │   └── api.ts                  # TypeScript API types
│   ├── utils/
│   │   └── sseClient.ts            # Custom SSE client with header support
│   ├── App.tsx                     # Router setup
│   └── main.tsx                    # Entry point
└── public/
```

## Usage

### Getting Started

1. Start the backend and frontend servers
2. Navigate to `http://localhost:5173`
3. Go to "API Keys" page
4. Create a new API key (save the plaintext key!)
5. Enter the key in the top navigation input
6. Status should show "✓ Connected"
7. Explore Deployments, Jobs, and Usage pages

### Testing Jobs

1. **Create a deployment** (optional but recommended):
   - Go to Deployments page
   - Create a deployment (e.g., `llama-3-8b`)
   - Activate it

2. **Create a job**:
   - Go to Jobs page
   - Click "+ Create Job"
   - Select deployment (optional)
   - Enter input JSON:
     ```json
     {
       "prompt": "Hello, world!",
       "max_tokens": 100
     }
     ```
   - Set optional timeout/retry configuration
   - Click "Create Job"

3. **View job details**:
   - Job details drawer opens automatically
   - Watch live status updates via SSE
   - See events timeline
   - View input/output JSON
   - Cancel if needed (for QUEUED/RUNNING jobs)

4. **Monitor all jobs**:
   - Jobs table shows latest 20 jobs
   - Color-coded status chips
   - Copy job IDs to clipboard
   - Click "View" to see details

### Testing Usage Monitoring

1. Generate some traffic by creating deployments, jobs, etc.
2. Navigate to "Usage" page
3. View summary metrics and recent events (last 1 hour)
4. Use filters to narrow down by endpoint or API key

### Dark Theme

The app uses a dark theme with the following color scheme:

- Background: `#0f0f1e`
- Cards/Panels: `#1a1a2e`
- Borders: `#333`
- Primary (Brand): `#6c63ff` (purple)
- Success: `#4caf50` (green)
- Error: `#f44336` (red)
- Warning: `#ff9800` (orange)

## Development

### Adding New Pages

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/Layout.tsx`

### Adding New API Endpoints

1. Define TypeScript types in `src/types/api.ts`
2. Add RTK Query endpoint in `src/store/apiSlice.ts`
3. Export generated hook
4. Use hook in component with `const { data, error, isLoading } = useMyQuery()`

### Type Safety

All API responses are typed. When adding new endpoints:

- Match backend DTOs/entities
- Use proper TypeScript interfaces
- Enable strict mode validation

## Technical Details

### SSE (Server-Sent Events) Implementation

The Jobs feature uses a custom SSE client (`src/utils/sseClient.ts`) that:
- Supports custom headers (native `EventSource` doesn't allow headers)
- Sends `x-api-key` header for authentication
- Uses Fetch API with `ReadableStream` for streaming
- Parses SSE message format (`event:` and `data:` lines)
- Handles JSON and plain text data
- Provides graceful connection/disconnection
- Auto-reconnects when job status changes
- Auto-closes on terminal states (SUCCEEDED, FAILED, CANCELLED, TIMED_OUT)

### Real-time Job Updates

When viewing job details:
1. SSE connection established to `/api/jobs/:id/events`
2. Initial job state sent immediately
3. Status updates streamed as job progresses
4. Job details refetched on each status change
5. Event timeline updated with timestamps
6. Connection closed automatically on terminal state

### State Management

- **Redux**: API key persisted in localStorage
- **RTK Query**: Automatic caching, invalidation, and refetching
- **Cache Strategy**:
  - Refetch on focus (when switching back to browser tab)
  - Refetch on mount if data > 30 seconds old
  - Keep unused data for 60 seconds
  - Usage page polls every 30 seconds for near real-time data

## Notes

- **API Key Security**: Keys are stored in localStorage (clear on logout/revoke)
- **Error Handling**: All pages show error states with helpful messages
- **Loading States**: Skeleton loaders and loading indicators throughout
- **Real-time Updates**: RTK Query provides automatic cache invalidation and smart refetching
- **SSE Streaming**: Jobs page supports live status updates without polling
