import { useState } from 'react';

interface ApiKeyModalProps {
  apiKey: string;
  name: string;
  onClose: () => void;
}

export default function ApiKeyModal({ apiKey, name, onClose }: ApiKeyModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-dark-surface rounded-lg max-w-2xl w-11/12 max-h-[90vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-dark-border flex justify-between items-center">
          <h2 className="m-0 text-2xl">API Key Created Successfully</h2>
          <button 
            className="bg-transparent border-none text-gray-400 text-4xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center hover:text-white transition-colors" 
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-6">
          <p className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4 mb-6 text-yellow-500">
            ⚠️ <strong>Important:</strong> This is the only time you'll see this
            key. Copy it now and store it securely.
          </p>
          <div className="bg-dark-surface-hover rounded p-6 mb-6">
            <div className="mb-4 last:mb-0">
              <label className="block text-gray-400 text-sm mb-2">Name:</label>
              <span className="text-white">{name}</span>
            </div>
            <div className="mb-0">
              <label className="block text-gray-400 text-sm mb-2">API Key:</label>
              <code className="block bg-dark-surface p-3 rounded text-green-500 font-mono text-sm break-all border border-dark-border">
                {apiKey}
              </code>
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            <button 
              className="px-6 py-3 rounded border-none cursor-pointer text-base font-medium transition-colors bg-primary text-white hover:bg-primary-hover" 
              onClick={handleCopy}
            >
              {copied ? '✓ Copied!' : 'Copy API Key'}
            </button>
            <button 
              className="px-6 py-3 rounded border-none cursor-pointer text-base font-medium transition-colors bg-gray-700 text-white hover:bg-gray-600" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
