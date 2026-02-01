import { useState } from 'react';

interface CreateDeploymentModalProps {
  onSubmit: (modelName: string, configJson: Record<string, any>) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export default function CreateDeploymentModal({
  onSubmit,
  onClose,
  isLoading,
}: CreateDeploymentModalProps) {
  const [modelName, setModelName] = useState('');
  const [configJsonText, setConfigJsonText] = useState('{\n  "gpu": "A100",\n  "memory": "16GB"\n}');
  const [jsonError, setJsonError] = useState('');

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modelName.trim()) {
      return;
    }

    // Validate JSON
    try {
      const parsed = JSON.parse(configJsonText);
      setJsonError('');
      await onSubmit(modelName, parsed);
    } catch (err) {
      setJsonError('Invalid JSON format. Please check your syntax.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-dark-surface rounded-lg max-w-3xl w-11/12 max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-dark-border flex justify-between items-center">
          <h2 className="m-0 text-2xl">Create Deployment</h2>
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
              <label htmlFor="model-name" className="block mb-2 text-gray-400 font-medium">
                Model Name *
              </label>
              <input
                id="model-name"
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g., llama-3-8b"
                required
                autoFocus
                disabled={isLoading}
                className="w-full px-3 py-3 border border-dark-border rounded bg-dark-surface-hover text-white text-base focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="config-json" className="block mb-2 text-gray-400 font-medium">
                Configuration JSON *
                {jsonError && <span className="text-red-500 text-sm"> - {jsonError}</span>}
              </label>
              <textarea
                id="config-json"
                value={configJsonText}
                onChange={(e) => {
                  setConfigJsonText(e.target.value);
                  setJsonError('');
                }}
                placeholder='{"gpu": "A100", "memory": "16GB"}'
                rows={8}
                required
                disabled={isLoading}
                className={`w-full px-3 py-3 border rounded bg-dark-surface-hover text-white text-base font-mono resize-y focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                  jsonError ? 'border-red-500' : 'border-dark-border focus:border-primary'
                }`}
              />
              <small className="block mt-2 text-gray-500 text-[0.85rem]">
                Enter a valid JSON object with your deployment configuration
              </small>
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
              disabled={isLoading || !modelName.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Deployment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
