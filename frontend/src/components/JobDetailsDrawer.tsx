import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  useGetJobByIdQuery,
  useCancelJobMutation,
} from '../store/apiSlice';
import { SSEClient, SSEEvent } from '../utils/sseClient';
import type { JobStatusEvent } from '../types/api';

interface JobDetailsDrawerProps {
  jobId: string;
  onClose: () => void;
}

export default function JobDetailsDrawer({
  jobId,
  onClose,
}: JobDetailsDrawerProps) {
  const apiKey = useSelector((state: RootState) => state.auth.apiKey);
  const {
    data: job,
    refetch,
    isLoading,
    error,
  } = useGetJobByIdQuery(jobId);
  const [cancelJob] = useCancelJobMutation();

  const [events, setEvents] = useState<JobStatusEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sseError, setSSEError] = useState<string | null>(null);
  const sseClientRef = useRef<SSEClient | null>(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const terminalStates = ['SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMED_OUT'];

  // Build initial event timeline from job data
  const buildInitialTimeline = (jobData: any): JobStatusEvent[] => {
    const timeline: JobStatusEvent[] = [];
    
    // QUEUED (createdAt)
    if (jobData.createdAt) {
      timeline.push({
        jobId: jobData.id,
        status: 'QUEUED',
        ts: jobData.createdAt,
      });
    }
    
    // RUNNING (startedAt)
    if (jobData.startedAt) {
      timeline.push({
        jobId: jobData.id,
        status: 'RUNNING',
        ts: jobData.startedAt,
      });
    }
    
    // Terminal states
    if (jobData.finishedAt) {
      timeline.push({
        jobId: jobData.id,
        status: jobData.status as JobStatusEvent['status'],
        ts: jobData.finishedAt,
        outputJson: jobData.outputJson,
        error: jobData.error,
      });
    } else if (jobData.cancelledAt) {
      timeline.push({
        jobId: jobData.id,
        status: 'CANCELLED',
        ts: jobData.cancelledAt,
        error: jobData.error,
      });
    }
    
    return timeline;
  };

  useEffect(() => {
    if (!apiKey || !job) return;

    // Initialize with historical events from job data
    const initialTimeline = buildInitialTimeline(job);
    setEvents(initialTimeline);

    // Connect to SSE stream for live updates
    const connectSSE = () => {
      const url = `${baseUrl}/api/jobs/${jobId}/events`;
      const headers = { 'x-api-key': apiKey };

      const client = new SSEClient(
        url,
        headers,
        (event: SSEEvent) => {
          if (event.type === 'status') {
            const statusEvent = event.data as JobStatusEvent;
            
            // Add new event only if it's not a duplicate (based on status and timestamp similarity)
            setEvents((prev) => {
              const isDuplicate = prev.some(
                (e) => e.status === statusEvent.status && 
                       Math.abs(new Date(e.ts).getTime() - new Date(statusEvent.ts).getTime()) < 1000
              );
              
              if (isDuplicate) {
                return prev;
              }
              
              return [...prev, statusEvent];
            });

            // Refetch job details when status changes
            refetch();

            // Disconnect if terminal state
            if (terminalStates.includes(statusEvent.status)) {
              setTimeout(() => {
                sseClientRef.current?.disconnect();
                setIsConnected(false);
              }, 1000);
            }
          }
        },
        (error: Error) => {
          console.error('SSE Error:', error);
          setSSEError(error.message);
          setIsConnected(false);
        }
      );

      sseClientRef.current = client;
      setIsConnected(true);
      setSSEError(null);
      client.connect();
    };

    // Only connect if not in terminal state
    if (!terminalStates.includes(job.status)) {
      connectSSE();
    }

    return () => {
      sseClientRef.current?.disconnect();
      sseClientRef.current = null;
      setIsConnected(false);
    };
  }, [jobId, apiKey, job?.status, baseUrl, refetch]);

  const handleCancel = async () => {
    if (!confirm(`Cancel job ${jobId.substring(0, 8)}...?`)) {
      return;
    }

    try {
      await cancelJob(jobId).unwrap();
    } catch (err) {
      console.error('Failed to cancel job:', err);
      alert('Failed to cancel job. It may already be in a terminal state.');
    }
  };

  const isCancellable = job && ['QUEUED', 'RUNNING', 'CANCEL_REQUESTED'].includes(job.status);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  };

  const getStatusClass = (status: string) => {
    const normalized = status.toUpperCase();
    if (normalized === 'SUCCEEDED') return 'bg-green-500/20 text-green-500';
    if (normalized === 'RUNNING') return 'bg-blue-500/20 text-blue-500';
    if (normalized === 'QUEUED') return 'bg-gray-500/20 text-gray-400';
    if (normalized === 'FAILED' || normalized === 'TIMED_OUT') return 'bg-red-500/20 text-red-500';
    if (normalized === 'CANCELLED' || normalized === 'CANCEL_REQUESTED')
      return 'bg-orange-500/20 text-orange-500';
    return '';
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 flex justify-end z-[1000] animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
        <div className="w-[600px] max-w-full h-full bg-dark-surface shadow-[-4px_0_24px_rgba(0,0,0,0.5)] flex flex-col animate-[slideIn_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-6 border-b border-dark-border bg-dark-surface-hover">
            <h2 className="m-0 text-2xl">Job Details</h2>
            <button 
              className="bg-transparent border-none text-gray-400 text-4xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center hover:text-white transition-colors" 
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4 text-red-500">
              Failed to load job details. The job may not exist or you may not have access.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !job) {
    return (
      <div className="fixed inset-0 bg-black/70 flex justify-end z-[1000] animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
        <div className="w-[600px] max-w-full h-full bg-dark-surface shadow-[-4px_0_24px_rgba(0,0,0,0.5)] flex flex-col animate-[slideIn_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-6 border-b border-dark-border bg-dark-surface-hover">
            <h2 className="m-0 text-2xl">Job Details</h2>
            <button 
              className="bg-transparent border-none text-gray-400 text-4xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center hover:text-white transition-colors" 
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-center py-12 text-gray-400">Loading job details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-end z-[1000] animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="w-[600px] max-w-full h-full bg-dark-surface shadow-[-4px_0_24px_rgba(0,0,0,0.5)] flex flex-col animate-[slideIn_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-dark-border bg-dark-surface-hover">
          <h2 className="m-0 text-2xl">Job Details</h2>
          <button 
            className="bg-transparent border-none text-gray-400 text-4xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center hover:text-white transition-colors" 
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Job Metadata */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-lg text-gray-400">Job Information</h3>
              {isCancellable && (
                <button 
                  className="px-4 py-2 text-sm rounded border-none font-medium bg-red-500 text-white cursor-pointer transition-colors hover:bg-red-600" 
                  onClick={handleCancel}
                >
                  Cancel Job
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-medium">Job ID</label>
                <code className="bg-dark-bg p-2 rounded text-[0.85rem] text-gray-400 break-all">
                  {job.id}
                </code>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-medium">Status</label>
                <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-semibold uppercase ${getStatusClass(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-medium">Deployment ID</label>
                <code className="bg-dark-bg p-2 rounded text-[0.85rem] text-gray-400 break-all">
                  {job.deploymentId || '—'}
                </code>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-medium">Created</label>
                <span className="text-white">{formatDate(job.createdAt)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-medium">Started</label>
                <span className="text-white">{formatDate(job.startedAt)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-medium">Finished</label>
                <span className="text-white">{formatDate(job.finishedAt || job.cancelledAt)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-medium">Timeout</label>
                <span className="text-white">{job.timeoutMs}ms</span>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] text-gray-500 font-medium">Attempts</label>
                <span className="text-white">
                  {job.attempt} / {job.maxAttempts}
                </span>
              </div>
            </div>
          </div>

          {/* Input JSON */}
          <div className="mb-8">
            <h3 className="m-0 mb-4 text-lg text-gray-400">Input</h3>
            <pre className="bg-dark-bg border border-dark-border rounded p-4 font-mono text-sm text-gray-400 overflow-x-auto m-0">
              {JSON.stringify(job.inputJson, null, 2)}
            </pre>
          </div>

          {/* Output JSON */}
          {job.outputJson && (
            <div className="mb-8">
              <h3 className="m-0 mb-4 text-lg text-gray-400">Output</h3>
              <pre className="bg-dark-bg border border-dark-border rounded p-4 font-mono text-sm text-gray-400 overflow-x-auto m-0">
                {JSON.stringify(job.outputJson, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {job.error && (
            <div className="mb-8">
              <h3 className="m-0 mb-4 text-lg text-gray-400">Error</h3>
              <div className="bg-red-500/10 border border-red-500/30 rounded p-4 text-red-500">
                {job.error}
              </div>
            </div>
          )}

          {/* Live Events */}
          <div className="mb-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-lg text-gray-400">Live Events</h3>
              {isConnected && <span className="text-sm font-medium text-green-500">● Connected</span>}
              {!isConnected && !terminalStates.includes(job.status) && (
                <span className="text-sm font-medium text-gray-400">● Disconnected</span>
              )}
            </div>

            {sseError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-4 my-4 text-red-500">
                <strong>Connection Error:</strong> {sseError}
              </div>
            )}

            <div className="bg-dark-bg border border-dark-border rounded p-4 max-h-[300px] overflow-y-auto">
              {events.length > 0 ? (
                events.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border-b border-dark-border last:border-b-0">
                    <span className="text-[0.85rem] text-gray-500 min-w-[100px]">
                      {new Date(event.ts).toLocaleTimeString()}
                    </span>
                    <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-semibold uppercase ${getStatusClass(event.status)}`}>
                      {event.status}
                    </span>
                    {event.error && <span className="text-red-500 text-[0.85rem] ml-auto">{event.error}</span>}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {terminalStates.includes(job.status)
                    ? 'Job completed - no live events'
                    : 'Waiting for events...'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
