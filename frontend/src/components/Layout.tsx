import { Link, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect, useRef } from 'react';
import { setApiKey, clearApiKey } from '../store/authSlice';
import { useGetUsageSummaryQuery } from '../store/apiSlice';
import { isAuthError } from '../utils/errorNormalizer';
import type { RootState } from '../store/store';

export default function Layout() {
  const dispatch = useDispatch();
  const apiKey = useSelector((state: RootState) => state.auth.apiKey);
  const [debouncedApiKey, setDebouncedApiKey] = useState(apiKey);
  const [inputValue, setInputValue] = useState(apiKey || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isError, isSuccess, error } = useGetUsageSummaryQuery(
    { range: '1h' },
    { 
      skip: !debouncedApiKey,
      refetchOnMountOrArgChange: true,
    }
  );

  useEffect(() => {
    if (apiKey !== inputValue) {
      setInputValue(apiKey || '');
    }
  }, [apiKey]);

  const isConnected = debouncedApiKey && isSuccess;
  const showAuthError = debouncedApiKey && isError && isAuthError(error);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const trimmed = inputValue.trim();
      if (trimmed !== debouncedApiKey) {
        setDebouncedApiKey(trimmed);
        if (trimmed) {
          dispatch(setApiKey(trimmed));
        } else {
          dispatch(clearApiKey());
        }
      }
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, debouncedApiKey, dispatch]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const getConnectionStatus = () => {
    if (!debouncedApiKey) {
      return <span className="text-sm font-bold min-w-[100px] text-center text-gray-400">Not connected</span>;
    }
    if (isError) {
      return <span className="text-sm font-bold min-w-[100px] text-center text-red-500">✗ Invalid/Revoked</span>;
    }
    if (isSuccess) {
      return <span className="text-sm font-bold min-w-[100px] text-center text-green-500">✓ Connected</span>;
    }
    return <span className="text-sm font-bold min-w-[100px] text-center text-primary">⟳ Checking...</span>;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-dark-surface text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-8">
          <h2 className="m-0 text-2xl">GPU PaaS Mini</h2>
          <div className="flex gap-6">
            <Link to="/api-keys" className="text-gray-400 no-underline px-4 py-2 rounded transition-all hover:text-white hover:bg-white/10">
              API Keys
            </Link>
            <Link to="/deployments" className="text-gray-400 no-underline px-4 py-2 rounded transition-all hover:text-white hover:bg-white/10">
              Deployments
            </Link>
            <Link to="/jobs" className="text-gray-400 no-underline px-4 py-2 rounded transition-all hover:text-white hover:bg-white/10">
              Jobs
            </Link>
            <Link to="/usage" className="text-gray-400 no-underline px-4 py-2 rounded transition-all hover:text-white hover:bg-white/10">
              Usage
            </Link>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="api-key-input" className="text-sm text-gray-400">
              API Key:
            </label>
            <input
              id="api-key-input"
              type="text"
              placeholder="Enter your API key"
              value={inputValue}
              onChange={handleApiKeyChange}
              className="px-2 py-2 border border-dark-border rounded bg-dark-surface-hover text-white font-mono min-w-[250px] focus:outline-none focus:border-primary"
            />
            {getConnectionStatus()}
          </div>
        </div>
      </nav>
      
      {showAuthError && (
        <div className="bg-[rgba(255,152,0,0.15)] border-b-2 border-[rgba(255,152,0,0.5)] px-8 py-3 flex items-center gap-2 text-[#ff9800] text-[0.95rem]">
          <span className="text-lg">⚠️</span>
          <span>Invalid API key. Please set a valid key from the </span>
          <Link to="/api-keys" className="text-primary underline font-medium hover:text-primary-hover">
            API Keys page
          </Link>
          <span>.</span>
        </div>
      )}
      
      <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full">
        <Outlet context={{ isConnected }} />
      </main>
    </div>
  );
}
