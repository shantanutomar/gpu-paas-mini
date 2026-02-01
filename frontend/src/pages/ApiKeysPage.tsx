import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
} from '../store/apiSlice';
import type { RootState } from '../store/store';
import { clearApiKey } from '../store/authSlice';
import ApiKeyModal from '../components/ApiKeyModal';
import ConfirmModal from '../components/ConfirmModal';
import type { ApiKeyWithPlaintext } from '../types/api';

type ConfirmStep = 'revoke' | 'success' | null;

export default function ApiKeysPage() {
  const dispatch = useDispatch();
  const currentApiKey = useSelector((state: RootState) => state.auth.apiKey);
  const { data: apiKeys, isLoading, error } = useGetApiKeysQuery();
  const [createApiKey, { isLoading: isCreating }] = useCreateApiKeyMutation();
  const [revokeApiKey] = useRevokeApiKeyMutation();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<ApiKeyWithPlaintext | null>(null);
  
  const [confirmStep, setConfirmStep] = useState<ConfirmStep>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);
  const [wasActiveKey, setWasActiveKey] = useState(false);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const result = await createApiKey({ name: newKeyName }).unwrap();
      setCreatedKey(result);
      setNewKeyName('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create API key:', err);
      alert('Failed to create API key. Please try again.');
    }
  };

  const handleRevokeClick = (id: string, name: string) => {
    setRevokeTarget({ id, name });
    setConfirmStep('revoke');
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;

    try {
      await revokeApiKey(revokeTarget.id).unwrap();
      
      if (currentApiKey) {
        dispatch(clearApiKey());
        setWasActiveKey(true);
      } else {
        setWasActiveKey(false);
      }
      
      setConfirmStep('success');
    } catch (err) {
      console.error('Failed to revoke API key:', err);
      setConfirmStep(null);
      setRevokeTarget(null);
    }
  };

  const handleCloseSuccess = () => {
    setConfirmStep(null);
    setRevokeTarget(null);
    setWasActiveKey(false);
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
          : 'Failed to load API keys';

    return (
      <div className="max-w-4xl">
        <h1 className="text-4xl font-normal leading-tight mb-4">API Keys</h1>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4 text-red-500">
          <strong>Error:</strong> {errorMessage}
        </div>
        <p className="text-gray-400 mt-4">
          Make sure you have a valid API key entered in the top navigation.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="m-0 text-4xl font-normal leading-tight">API Keys</h1>
        <button
          className="rounded border border-transparent px-5 py-2.5 text-base font-medium bg-primary text-white cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={isCreating}
        >
          {showCreateForm ? 'Cancel' : '+ Create API Key'}
        </button>
      </div>

      {showCreateForm && (
        <form className="bg-dark-surface p-6 rounded-lg mb-8 border border-dark-border" onSubmit={handleCreateKey}>
          <div className="mb-4">
            <label htmlFor="key-name" className="block mb-2 text-gray-400">
              API Key Name:
            </label>
            <input
              id="key-name"
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., Production Key"
              required
              autoFocus
              className="w-full max-w-md px-3 py-2.5 border border-dark-border rounded bg-dark-surface-hover text-white text-base focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded border border-transparent px-5 py-2.5 text-base font-medium bg-primary text-white cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCreating || !newKeyName.trim()}
          >
            {isCreating ? 'Creating...' : 'Create Key'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading API keys...</div>
      ) : (
        <div className="bg-dark-surface rounded-lg overflow-hidden border border-dark-border">
          <table className="w-full border-collapse">
            <thead className="bg-dark-surface-hover">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Name</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Key ID</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Created</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Status</th>
                <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys && apiKeys.length > 0 ? (
                apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-primary/5">
                    <td className="p-4 border-b border-dark-border last:border-b-0 font-medium">{key.name}</td>
                    <td className="p-4 border-b border-dark-border last:border-b-0">
                      <code className="bg-dark-surface-hover px-2 py-1 rounded font-mono text-sm text-primary">
                        {key.id.substring(0, 8)}...
                      </code>
                    </td>
                    <td className="p-4 border-b border-dark-border last:border-b-0">{formatDate(key.createdAt)}</td>
                    <td className="p-4 border-b border-dark-border last:border-b-0">
                      {key.revokedAt ? (
                        <span className="inline-block px-3 py-1 rounded-xl text-[0.85rem] font-medium bg-red-500/20 text-red-500">
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-xl text-[0.85rem] font-medium bg-green-500/20 text-green-500">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 border-b border-dark-border last:border-b-0">
                      {!key.revokedAt && (
                        <button
                          className="px-4 py-2 text-sm rounded border border-transparent font-medium bg-red-500 text-white cursor-pointer transition-colors hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => handleRevokeClick(key.id, key.name)}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-12">
                    No API keys found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {createdKey && (
        <ApiKeyModal
          apiKey={createdKey.key}
          name={createdKey.name}
          onClose={() => setCreatedKey(null)}
        />
      )}

      <ConfirmModal
        isOpen={confirmStep === 'revoke'}
        title="Revoke API Key"
        message={`Are you sure you want to revoke the key "${revokeTarget?.name}"?\n\nThis action cannot be undone.`}
        confirmText="Yes, Revoke"
        cancelText="Cancel"
        onConfirm={handleConfirmRevoke}
        onCancel={() => {
          setConfirmStep(null);
          setRevokeTarget(null);
        }}
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmStep === 'success'}
        title="Key Revoked Successfully"
        message={
          wasActiveKey
            ? `✓ The key "${revokeTarget?.name}" has been revoked and removed from your session.\n\nPlease create a new API key or paste an active one in the top navigation.`
            : `✓ The key "${revokeTarget?.name}" has been revoked successfully.`
        }
        confirmText="OK"
        cancelText=""
        onConfirm={handleCloseSuccess}
        onCancel={handleCloseSuccess}
        variant="info"
      />
    </div>
  );
}
