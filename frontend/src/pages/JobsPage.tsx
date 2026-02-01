import { useState } from 'react';
import { useGetJobsQuery } from '../store/apiSlice';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { normalizeError } from '../utils/errorNormalizer';
import type { JobEntity } from '../types/api';
import CreateJobModal from '../components/CreateJobModal';
import JobDetailsDrawer from '../components/JobDetailsDrawer';

export default function JobsPage() {
  const isConnected = useConnectionStatus();
  const { data: jobs, isLoading, error, refetch } = useGetJobsQuery(undefined, {
    skip: !isConnected,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleJobCreated = (job: JobEntity) => {
    setShowCreateModal(false);
    // Auto-open the created job
    setSelectedJobId(job.id);
  };

  const handleDrawerClose = () => {
    setSelectedJobId(null);
    // Refetch jobs list to get updated statuses after drawer closes
    refetch();
  };

  // If not connected, show message
  if (!isConnected) {
    return (
      <div className="max-w-7xl">
        <h1 className="text-4xl font-normal leading-tight mb-4">Jobs</h1>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 my-4 text-blue-500 text-center">
          <p className="m-0 text-lg">⚠️ Please enter a valid API key in the top navigation to use Jobs.</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (error) {
    const normalizedError = normalizeError(error);

    return (
      <div className="max-w-7xl">
        <h1 className="text-4xl font-normal leading-tight mb-4">Jobs</h1>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4 text-red-500">
          <strong>Error:</strong> {normalizedError.message}
          {normalizedError.code && <span className="font-mono text-sm opacity-80"> ({normalizedError.code})</span>}
        </div>
        <button 
          className="rounded border border-transparent px-5 py-2.5 text-base font-medium bg-dark-surface-hover text-white cursor-pointer transition-colors hover:bg-dark-surface"
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="m-0 text-4xl font-normal leading-tight">Jobs</h1>
        <button
          className="rounded border border-transparent px-5 py-2.5 text-base font-medium bg-primary text-white cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => setShowCreateModal(true)}
          disabled={!isConnected}
          title={!isConnected ? 'Please connect with a valid API key' : ''}
        >
          + Create Job
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading jobs...</div>
      ) : (
        <div className="bg-dark-surface rounded-lg overflow-hidden border border-dark-border">
          <table className="w-full border-collapse">
            <thead className="bg-dark-surface-hover">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Job ID</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Status</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Deployment</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Created</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Finished</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs && jobs.length > 0 ? (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-primary/5">
                    <td className="p-3 border-b border-dark-border last:border-b-0">
                      <div className="flex items-center gap-2">
                        <code className="bg-dark-bg px-2 py-1 rounded text-sm text-gray-400">
                          {job.id.substring(0, 8)}…
                        </code>
                        <button
                          className="bg-transparent border-none cursor-pointer text-base p-1 opacity-60 hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(job.id)}
                          title="Copy full ID"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="p-3 border-b border-dark-border last:border-b-0">
                      <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-semibold uppercase ${getStatusClass(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3 border-b border-dark-border last:border-b-0">
                      {job.deployment ? (
                        <span className="text-white font-medium">{job.deployment.modelName}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3 border-b border-dark-border last:border-b-0 text-sm text-gray-400 whitespace-nowrap">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="p-3 border-b border-dark-border last:border-b-0 text-sm text-gray-400 whitespace-nowrap">
                      {formatDate(job.finishedAt || job.cancelledAt)}
                    </td>
                    <td className="p-3 border-b border-dark-border last:border-b-0">
                      <button
                        className="px-4 py-2 text-sm rounded border border-transparent font-medium bg-dark-surface-hover text-white cursor-pointer transition-colors hover:bg-dark-bg"
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-12">
                    No jobs found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateJobModal
          onClose={() => setShowCreateModal(false)}
          onJobCreated={handleJobCreated}
        />
      )}

      {selectedJobId && (
        <JobDetailsDrawer
          jobId={selectedJobId}
          onClose={handleDrawerClose}
        />
      )}
    </div>
  );
}
