import { useState } from 'react';
import {
  useGetDeploymentsQuery,
  useCreateDeploymentMutation,
  useActivateDeploymentMutation,
} from '../store/apiSlice';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { normalizeError } from '../utils/errorNormalizer';
import CreateDeploymentModal from '../components/CreateDeploymentModal';

export default function DeploymentsPage() {
  const isConnected = useConnectionStatus();
  const { data: deployments, isLoading, error, refetch } = useGetDeploymentsQuery(undefined, {
    skip: !isConnected,
  });
  const [createDeployment, { isLoading: isCreating }] = useCreateDeploymentMutation();
  const [activateDeployment] = useActivateDeploymentMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateDeployment = async (
    modelName: string,
    configJson: Record<string, any>
  ) => {
    try {
      await createDeployment({ modelName, configJson }).unwrap();
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create deployment:', err);
      alert('Failed to create deployment. Please try again.');
      throw err; // Re-throw to prevent modal from closing
    }
  };

  const handleActivate = async (id: string, modelName: string) => {
    if (!confirm(`Activate deployment "${modelName}"? This will deactivate all others.`)) {
      return;
    }

    try {
      await activateDeployment(id).unwrap();
    } catch (err) {
      console.error('Failed to activate deployment:', err);
      alert('Failed to activate deployment. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (error) {
    const errorMessage =
      'data' in error
        ? JSON.stringify(error.data)
        : 'message' in error
          ? error.message
          : 'Failed to load deployments';

    return (
      <div className="error-container">
        <h1>Deployments</h1>
        <div className="error-message">
          <strong>Error:</strong> {errorMessage}
        </div>
        <p className="error-hint">
          Make sure you have a valid API key entered in the top navigation.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="m-0 text-4xl font-normal leading-tight">Deployments</h1>
        <button
          className="rounded border border-transparent px-5 py-2.5 text-base font-medium bg-primary text-white cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => setShowCreateModal(true)}
          disabled={isCreating || !isConnected}
          title={!isConnected ? 'Please connect with a valid API key' : ''}
        >
          + Create Deployment
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading deployments...</div>
      ) : (
        <div className="bg-dark-surface rounded-lg overflow-hidden border border-dark-border">
          <table className="w-full border-collapse">
            <thead className="bg-dark-surface-hover">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Model Name</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">ID</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Configuration</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Created</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Status</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deployments && deployments.length > 0 ? (
                deployments.map((deployment) => (
                  <tr key={deployment.id} className="hover:bg-primary/5">
                    <td className="p-4 border-b border-dark-border last:border-b-0 font-medium text-primary">
                      {deployment.modelName}
                    </td>
                    <td className="p-4 border-b border-dark-border last:border-b-0">
                      <code className="bg-dark-surface-hover px-2 py-1 rounded font-mono text-sm text-gray-400">
                        {deployment.id.substring(0, 8)}...
                      </code>
                    </td>
                    <td className="p-4 border-b border-dark-border last:border-b-0">
                      <details className="cursor-pointer">
                        <summary className="text-primary select-none hover:underline">
                          View Config
                        </summary>
                        <pre className="mt-2 p-3 bg-dark-bg rounded border border-dark-border text-[0.85rem] overflow-x-auto max-w-md">
                          {JSON.stringify(deployment.configJson, null, 2)}
                        </pre>
                      </details>
                    </td>
                    <td className="p-4 border-b border-dark-border last:border-b-0">{formatDate(deployment.createdAt)}</td>
                    <td className="p-4 border-b border-dark-border last:border-b-0">
                      {deployment.isActive ? (
                        <span className="inline-block px-3 py-1 rounded-xl text-[0.85rem] font-medium bg-green-500/20 text-green-500">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-xl text-[0.85rem] font-medium bg-gray-500/20 text-gray-400">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 border-b border-dark-border last:border-b-0">
                      {!deployment.isActive && (
                        <button
                          className="px-4 py-2 text-sm rounded border border-transparent font-medium bg-primary text-white cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() =>
                            handleActivate(deployment.id, deployment.modelName)
                          }
                          disabled={!isConnected}
                          title={!isConnected ? 'Please connect with a valid API key' : ''}
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-12">
                    No deployments found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CreateDeploymentModal
          onSubmit={handleCreateDeployment}
          onClose={() => setShowCreateModal(false)}
          isLoading={isCreating}
        />
      )}
    </div>
  );
}
