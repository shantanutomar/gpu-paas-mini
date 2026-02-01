import { useState } from 'react';
import {
  useCreateJobMutation,
  useGetDeploymentsQuery,
} from '../store/apiSlice';
import type { JobEntity } from '../types/api';

interface CreateJobModalProps {
  onClose: () => void;
  onJobCreated: (job: JobEntity) => void;
}

export default function CreateJobModal({
  onClose,
  onJobCreated,
}: CreateJobModalProps) {
  const [deploymentId, setDeploymentId] = useState('');
  const [inputJsonText, setInputJsonText] = useState('{\n  "prompt": "Hello, world!",\n  "max_tokens": 100\n}');
  const [timeoutMs, setTimeoutMs] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [retryDelayMs, setRetryDelayMs] = useState('');
  const [jsonError, setJsonError] = useState('');

  const [createJob, { isLoading }] = useCreateJobMutation();
  const { data: deployments } = useGetDeploymentsQuery();

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JSON
    let inputJson: Record<string, any>;
    try {
      inputJson = JSON.parse(inputJsonText);
      setJsonError('');
    } catch {
      setJsonError('Invalid JSON format. Please check your syntax.');
      return;
    }

    try {
      const payload: any = { inputJson };
      if (deploymentId) payload.deploymentId = deploymentId;
      if (timeoutMs) payload.timeoutMs = parseInt(timeoutMs, 10);
      if (maxAttempts) payload.maxAttempts = parseInt(maxAttempts, 10);
      if (retryDelayMs) payload.retryDelayMs = parseInt(retryDelayMs, 10);

      const job = await createJob(payload).unwrap();
      onJobCreated(job);
    } catch (err) {
      console.error('Failed to create job:', err);
      alert('Failed to create job. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div
        className="bg-dark-surface rounded-lg max-w-4xl w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-dark-border flex justify-between items-center">
          <h2 className="m-0 text-2xl">Create Job</h2>
          <button 
            className="bg-transparent border-none text-gray-400 text-4xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center hover:text-white transition-colors" 
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form onSubmit={validateAndSubmit}>
          <div className="p-6">
            <div className="mb-6">
              <label htmlFor="deployment-id" className="block mb-2 text-gray-400 font-medium">
                Deployment ID (optional)
              </label>
              {deployments && deployments.length > 0 ? (
                <select
                  id="deployment-id"
                  value={deploymentId}
                  onChange={(e) => setDeploymentId(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-3 border border-dark-border rounded bg-dark-surface-hover text-white text-base cursor-pointer focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">None</option>
                  {deployments.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.modelName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="deployment-id"
                  type="text"
                  value={deploymentId}
                  onChange={(e) => setDeploymentId(e.target.value)}
                  placeholder="Enter deployment ID (optional)"
                  disabled={isLoading}
                  className="w-full px-3 py-3 border border-dark-border rounded bg-dark-surface-hover text-white text-base focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                />
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="input-json" className="block mb-2 text-gray-400 font-medium">
                Input JSON *
                {jsonError && <span className="text-red-500 text-sm"> - {jsonError}</span>}
              </label>
              <textarea
                id="input-json"
                value={inputJsonText}
                onChange={(e) => {
                  setInputJsonText(e.target.value);
                  setJsonError('');
                }}
                placeholder='{"prompt": "Hello", "max_tokens": 100}'
                rows={8}
                required
                disabled={isLoading}
                className={`w-full px-3 py-3 border rounded bg-dark-surface-hover text-white text-base font-mono resize-y focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                  jsonError ? 'border-red-500' : 'border-dark-border focus:border-primary'
                }`}
              />
              <small className="block mt-2 text-gray-500 text-[0.85rem]">
                Enter a valid JSON object with your job parameters
              </small>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="mb-0">
                <label htmlFor="timeout-ms" className="block mb-2 text-gray-400 font-medium">
                  Timeout (ms)
                </label>
                <input
                  id="timeout-ms"
                  type="number"
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(e.target.value)}
                  placeholder="60000"
                  min="1000"
                  max="600000"
                  disabled={isLoading}
                  className="w-full px-3 py-3 border border-dark-border rounded bg-dark-surface-hover text-white text-base focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <small className="block mt-2 text-gray-500 text-[0.85rem]">Default: 60000 (1 min)</small>
              </div>

              <div className="mb-0">
                <label htmlFor="max-attempts" className="block mb-2 text-gray-400 font-medium">
                  Max Attempts
                </label>
                <input
                  id="max-attempts"
                  type="number"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                  placeholder="1"
                  min="1"
                  max="5"
                  disabled={isLoading}
                  className="w-full px-3 py-3 border border-dark-border rounded bg-dark-surface-hover text-white text-base focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <small className="block mt-2 text-gray-500 text-[0.85rem]">Default: 1 (no retry)</small>
              </div>

              <div className="mb-0">
                <label htmlFor="retry-delay-ms" className="block mb-2 text-gray-400 font-medium">
                  Retry Delay (ms)
                </label>
                <input
                  id="retry-delay-ms"
                  type="number"
                  value={retryDelayMs}
                  onChange={(e) => setRetryDelayMs(e.target.value)}
                  placeholder="1000"
                  min="100"
                  max="60000"
                  disabled={isLoading}
                  className="w-full px-3 py-3 border border-dark-border rounded bg-dark-surface-hover text-white text-base focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <small className="block mt-2 text-gray-500 text-[0.85rem]">Default: 1000 (1 sec)</small>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-dark-border flex gap-4 justify-end">
            <button
              type="button"
              className="px-6 py-3 rounded border-none cursor-pointer text-base font-medium transition-colors bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded border-none cursor-pointer text-base font-medium transition-colors bg-primary text-white hover:bg-primary-hover disabled:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
