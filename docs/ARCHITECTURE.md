# System Architecture & Design

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ API Keys │  │Deployments│  │   Jobs   │  │  Usage   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────┬──────────────────────────┬────────────────────────────┘
         │ HTTP/REST                │ SSE (Server-Sent Events)
         │                          │
┌────────▼──────────────────────────▼────────────────────────────┐
│                    NestJS Backend API                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ API Keys │  │Deployments│  │   Jobs   │  │  Usage   │      │
│  │  Module  │  │  Module   │  │  Module  │  │  Module  │      │
│  └────┬─────┘  └────┬──────┘  └────┬─────┘  └────┬─────┘      │
│       │             │               │             │            │
│  ┌────▼─────────────▼───────────────▼─────────────▼─────┐      │
│  │            Prisma ORM (Database Layer)              │      │
│  └──────────────────────┬──────────────────────────────┘      │
│                         │                                      │
│       ┌─────────────────┼────────────────┐                    │
│       │                 │                │                    │
│  ┌────▼────┐      ┌─────▼─────┐    ┌────▼────┐              │
│  │ BullMQ  │      │ Auth      │    │ SSE     │              │
│  │ Queue   │      │ Guard     │    │ Events  │              │
│  └────┬────┘      └───────────┘    └─────────┘              │
└───────┼───────────────────┬──────────────────────────────────┘
        │                   │
        │              ┌────▼────────┐
        │              │ PostgreSQL  │
        │              │  (Database) │
        │              └─────────────┘
        │
   ┌────▼────┐
   │  Redis  │◄──────────────┐
   │ (Queue) │                │
   └────┬────┘                │
        │                     │
┌───────▼─────────────────────┴───────────────────────────┐
│                    Worker Process                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  BullMQ Consumer (GPU Job Processor)             │   │
│  │  - Polls Redis queue                             │   │
│  │  - Executes jobs with retry logic               │   │
│  │  - Updates PostgreSQL with results              │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## System Design & Component Interaction

- **Three-tier architecture**: Frontend (React) → Backend (NestJS) → Worker processes
- **Communication patterns**: REST APIs for synchronous operations, Server-Sent Events (SSE) for real-time job updates
- **Data persistence**: Prisma ORM for database interactions, PostgreSQL for shared persistent storage
- **Job queue management**: BullMQ with Redis for asynchronous job processing and worker coordination
- **Security**: Global API key guard validates authentication on every request before reaching controllers

---

## Distributed Architecture Approach

- **Decoupled services**: API handling separated from job execution for independent scaling of backend and worker
- **Non-blocking design**: Backend enqueues jobs to Redis immediately and returns, preventing API timeouts
- **Asynchronous processing**: Workers poll Redis queue and execute jobs with retry logic and exponential backoff
- **Event-driven updates**: SSE connections stream real-time job status without client polling overhead
- **Shared state**: PostgreSQL serves as single source of truth, ensuring consistency across all services

---

## Trade-offs & Assumptions

- **In-memory usage tracking**: Fast access (1000 events) but data lost on restart; chose performance over persistence
- **Single active deployment**: Simplified job routing logic but prevents A/B testing and canary deployments
- **Shared database**: Enables ACID transactions and consistency but creates tight coupling between services
- **SHA-256 for API keys**: Faster hashing acceptable for high-entropy random keys (not user passwords)
- **Key assumptions**: Jobs complete within 60s; <1000 concurrent users; single-region deployment sufficient

---

## Scalability Considerations

- **Horizontal scaling**: Backend and worker scale independently via containers; load balancer distributes traffic
- **Caching layer**: Redis cache for expensive queries (deployments, API keys) with TTL-based invalidation
- **Current limitations**: In-memory usage tracking and SSE sticky sessions prevent pure stateless scaling

---

## Areas for Future Improvement

- **Tests coverage**: Basic minimal tests currently, increase test coverage
- **Theme setup**: Theme usage allowing dark/light modes
- **Persistent analytics**: Time-series database (InfluxDB/TimescaleDB) for long-term retention and advanced dashboards
- **Production monitoring**: OpenTelemetry tracing, Prometheus metrics, structured logging (ELK stack) for debugging