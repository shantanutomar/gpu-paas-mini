// API response types matching backend

export interface ApiKeyEntity {
  id: string;
  name: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface ApiKeyWithPlaintext extends ApiKeyEntity {
  key: string; // Only returned once on creation
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface DeploymentEntity {
  id: string;
  modelName: string;
  configJson: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDeploymentRequest {
  modelName: string;
  configJson: Record<string, any>;
}

export interface HealthResponse {
  status: string;
}

export interface UsageEvent {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  apiKeyId: string | null;
  errorMessage?: string;
}

export interface EndpointStats {
  endpoint: string;
  total: number;
  errors: number;
  avgLatencyMs: number;
}

export interface ApiKeyStats {
  apiKeyId: string;
  total: number;
  errors: number;
}

export interface UsageSummary {
  range: string;
  total: number;
  success: number;
  errors: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  byEndpoint: EndpointStats[];
  byApiKey: ApiKeyStats[];
}

export interface GetUsageEventsParams {
  range?: string;
  endpoint?: string;
  apiKeyId?: string;
  limit?: number;
}

export interface GetUsageSummaryParams {
  range?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
  requestId?: string;
}

export type JobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'CANCEL_REQUESTED'
  | 'TIMED_OUT';

export interface JobEntity {
  id: string;
  deploymentId: string | null;
  deployment?: {
    id: string;
    modelName: string;
  } | null;
  status: JobStatus;
  inputJson: Record<string, any>;
  outputJson: Record<string, any> | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  cancelledAt: string | null;
  timeoutMs: number;
  attempt: number;
  maxAttempts: number;
  retryDelayMs: number | null;
  idempotencyKey: string | null;
}

export interface CreateJobRequest {
  deploymentId?: string;
  inputJson: Record<string, any>;
  timeoutMs?: number;
  maxAttempts?: number;
  retryDelayMs?: number;
}

export interface JobStatusEvent {
  jobId: string;
  status: JobStatus;
  ts: string;
  outputJson?: Record<string, any>;
  error?: string;
}
