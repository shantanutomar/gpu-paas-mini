import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';
import type {
  ApiKeyEntity,
  ApiKeyWithPlaintext,
  CreateApiKeyRequest,
  DeploymentEntity,
  CreateDeploymentRequest,
  HealthResponse,
  UsageEvent,
  UsageSummary,
  GetUsageEventsParams,
  GetUsageSummaryParams,
  JobEntity,
  CreateJobRequest,
} from '../types/api';

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const apiKey = (getState() as RootState).auth.apiKey;
      
      if (apiKey) {
        headers.set('x-api-key', apiKey);
      }
      
      return headers;
    },
  }),
  tagTypes: ['ApiKey', 'Deployment', 'Job', 'Health', 'Usage'],
  refetchOnFocus: true,
  refetchOnMountOrArgChange: 30,
  keepUnusedDataFor: 60,
  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => '/health',
      providesTags: ['Health'],
    }),
    
    getApiKeys: builder.query<ApiKeyEntity[], void>({
      query: () => '/api/api-keys',
      providesTags: ['ApiKey'],
    }),
    
    createApiKey: builder.mutation<ApiKeyWithPlaintext, CreateApiKeyRequest>({
      query: (body) => ({
        url: '/api/api-keys',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ApiKey'],
    }),
    
    revokeApiKey: builder.mutation<ApiKeyEntity, string>({
      query: (id) => ({
        url: `/api/api-keys/${id}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: ['ApiKey'],
    }),
    
    getDeployments: builder.query<DeploymentEntity[], void>({
      query: () => '/api/deployments',
      providesTags: ['Deployment'],
    }),
    
    createDeployment: builder.mutation<DeploymentEntity, CreateDeploymentRequest>({
      query: (body) => ({
        url: '/api/deployments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Deployment'],
    }),
    
    activateDeployment: builder.mutation<DeploymentEntity, string>({
      query: (id) => ({
        url: `/api/deployments/${id}/activate`,
        method: 'POST',
      }),
      invalidatesTags: ['Deployment'],
    }),

    getUsageEvents: builder.query<UsageEvent[], GetUsageEventsParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.range) searchParams.append('range', params.range);
        if (params.endpoint) searchParams.append('endpoint', params.endpoint);
        if (params.apiKeyId) searchParams.append('apiKeyId', params.apiKeyId);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        
        return `/api/usage/events?${searchParams.toString()}`;
      },
      providesTags: ['Usage'],
    }),

    getUsageSummary: builder.query<UsageSummary, GetUsageSummaryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.range) searchParams.append('range', params.range);
        
        return `/api/usage/summary?${searchParams.toString()}`;
      },
      providesTags: ['Usage'],
    }),

    getJobs: builder.query<JobEntity[], void>({
      query: () => '/api/jobs',
      providesTags: ['Job'],
    }),

    getJobById: builder.query<JobEntity, string>({
      query: (id) => `/api/jobs/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Job', id }],
    }),

    createJob: builder.mutation<JobEntity, CreateJobRequest>({
      query: (body) => ({
        url: '/api/jobs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Job'],
    }),

    cancelJob: builder.mutation<JobEntity, string>({
      query: (id) => ({
        url: `/api/jobs/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => ['Job', { type: 'Job', id }],
    }),
  }),
});

export const {
  useGetHealthQuery,
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
  useGetDeploymentsQuery,
  useCreateDeploymentMutation,
  useActivateDeploymentMutation,
  useGetUsageEventsQuery,
  useGetUsageSummaryQuery,
  useGetJobsQuery,
  useGetJobByIdQuery,
  useCreateJobMutation,
  useCancelJobMutation,
} = apiSlice;
