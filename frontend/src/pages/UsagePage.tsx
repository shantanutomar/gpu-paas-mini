import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  useGetUsageSummaryQuery,
  useGetUsageEventsQuery,
} from '../store/apiSlice';

export default function UsagePage() {
  const apiKey = useSelector((state: RootState) => state.auth.apiKey);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');

  // Always use 1h range for simplicity
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useGetUsageSummaryQuery(
    { range: '1h' },
    { skip: !apiKey, pollingInterval: 30000 }
  );

  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useGetUsageEventsQuery(
    {
      range: '1h',
      endpoint: selectedEndpoint || undefined,
      apiKeyId: selectedApiKey || undefined,
      limit: 200,
    },
    { skip: !apiKey, pollingInterval: 30000 }
  );

  // If no API key, show message
  if (!apiKey) {
    return (
      <div className="max-w-7xl">
        <h1 className="text-4xl font-normal leading-tight mb-4">Usage & Monitoring</h1>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-8 my-4 text-orange-500 text-center">
          <p className="m-0 text-lg">⚠️ Enter an API key in the top navigation to view usage data.</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (summaryError || eventsError) {
    const error = summaryError || eventsError;
    const errorMessage =
      error && 'data' in error
        ? JSON.stringify(error.data)
        : error && 'message' in error
          ? error.message
          : 'Failed to load usage data';

    return (
      <div className="max-w-7xl">
        <h1 className="text-4xl font-normal leading-tight mb-4">Usage & Monitoring</h1>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4 text-red-500">
          <strong>Error:</strong> {errorMessage}
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
  };

  const maskApiKeyId = (keyId: string | null) => {
    if (!keyId || keyId === 'unknown') return 'Unknown';
    return keyId.substring(0, 8) + '…';
  };

  const getStatusClass = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-500/20 text-green-500';
    if (statusCode >= 400 && statusCode < 500) return 'bg-orange-500/20 text-orange-500';
    if (statusCode >= 500) return 'bg-red-500/20 text-red-500';
    return '';
  };

  const getMethodClass = (method: string) => {
    const normalized = method.toUpperCase();
    if (normalized === 'GET') return 'bg-green-500/20 text-green-500';
    if (normalized === 'POST') return 'bg-blue-500/20 text-blue-500';
    if (normalized === 'PUT' || normalized === 'PATCH') return 'bg-orange-500/20 text-orange-500';
    if (normalized === 'DELETE') return 'bg-red-500/20 text-red-500';
    return 'bg-gray-500/20 text-gray-400';
  };

  const successRate = summary
    ? summary.total > 0
      ? Math.round((summary.success / summary.total) * 100)
      : 0
    : 0;

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="m-0 text-4xl font-normal leading-tight">Usage & Monitoring</h1>
        <div className="px-4 py-2 bg-dark-surface border border-dark-border rounded-md text-gray-400 text-sm font-medium">
          Last 1 Hour
        </div>
      </div>

      {summaryLoading ? (
        <div className="text-center py-12 text-gray-400">Loading summary...</div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2 font-medium">Total Requests</div>
              <div className="text-4xl font-semibold text-white">{summary.total.toLocaleString()}</div>
            </div>
            <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2 font-medium">Success Rate</div>
              <div className="text-4xl font-semibold text-white">
                {successRate}%
                <span className="block text-[0.85rem] text-gray-400 mt-2 font-normal">
                  {summary.success} / {summary.errors} errors
                </span>
              </div>
            </div>
            <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2 font-medium">Avg Latency</div>
              <div className="text-4xl font-semibold text-white">
                {summary.avgLatencyMs.toFixed(1)}
                <span className="text-base text-gray-400 ml-1">ms</span>
              </div>
            </div>
            <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2 font-medium">P95 Latency</div>
              <div className="text-4xl font-semibold text-white">
                {summary.p95LatencyMs.toFixed(1)}
                <span className="text-base text-gray-400 ml-1">ms</span>
              </div>
            </div>
          </div>

          <div className="flex gap-6 mb-8 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <label htmlFor="endpoint-filter" className="block mb-2 text-gray-400 text-sm font-medium">
                Filter by Endpoint:
              </label>
              <select
                id="endpoint-filter"
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-surface border border-dark-border rounded-md text-white text-base cursor-pointer focus:outline-none focus:border-primary"
              >
                <option value="">All Endpoints</option>
                {summary.byEndpoint.map((ep) => (
                  <option key={ep.endpoint} value={ep.endpoint}>
                    {ep.endpoint} ({ep.total})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[250px]">
              <label htmlFor="apikey-filter" className="block mb-2 text-gray-400 text-sm font-medium">
                Filter by API Key:
              </label>
              <select
                id="apikey-filter"
                value={selectedApiKey}
                onChange={(e) => setSelectedApiKey(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-surface border border-dark-border rounded-md text-white text-base cursor-pointer focus:outline-none focus:border-primary"
              >
                <option value="">All Keys</option>
                {summary.byApiKey.map((key) => (
                  <option key={key.apiKeyId} value={key.apiKeyId}>
                    {maskApiKeyId(key.apiKeyId)} ({key.total})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-8">
        <h2 className="mb-4 text-2xl">Recent Events</h2>
        {eventsLoading ? (
          <div className="text-center py-12 text-gray-400">Loading events...</div>
        ) : events && events.length > 0 ? (
          <div className="bg-dark-surface rounded-lg overflow-hidden border border-dark-border overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="bg-dark-surface-hover">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border whitespace-nowrap">Time</th>
                  <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border whitespace-nowrap">Method</th>
                  <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border whitespace-nowrap">Endpoint</th>
                  <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border whitespace-nowrap">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border whitespace-nowrap">Latency</th>
                  <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border whitespace-nowrap">API Key</th>
                  <th className="text-left p-4 font-semibold text-gray-400 border-b border-dark-border whitespace-nowrap">Error</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, idx) => (
                  <tr key={idx} className="hover:bg-primary/5">
                    <td className="p-3 border-b border-dark-border last:border-b-0 text-gray-400 text-[0.85rem] whitespace-nowrap">
                      {formatDate(event.timestamp)}
                    </td>
                    <td className="p-3 border-b border-dark-border last:border-b-0">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase ${getMethodClass(event.method)}`}>
                        {event.method}
                      </span>
                    </td>
                    <td className="p-3 border-b border-dark-border last:border-b-0">
                      <code className="bg-dark-bg px-2 py-1 rounded text-[0.85rem] text-gray-400">
                        {event.path}
                      </code>
                    </td>
                    <td className="p-3 border-b border-dark-border last:border-b-0">
                      <span className={`inline-block px-2 py-1 rounded text-[0.85rem] font-semibold ${getStatusClass(event.statusCode)}`}>
                        {event.statusCode}
                      </span>
                    </td>
                    <td className="p-3 border-b border-dark-border last:border-b-0 font-mono text-gray-400">
                      {event.durationMs}ms
                    </td>
                    <td className="p-3 border-b border-dark-border last:border-b-0">
                      <code className="bg-dark-bg px-2 py-1 rounded text-[0.85rem] text-gray-400">
                        {maskApiKeyId(event.apiKeyId)}
                      </code>
                    </td>
                    <td className="p-3 border-b border-dark-border last:border-b-0 text-red-500 text-[0.85rem]">
                      {event.errorMessage ? (
                        <span>{event.errorMessage}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 bg-dark-surface rounded-lg border border-dark-border">
            No events found for the selected time range and filters.
          </div>
        )}
      </div>
    </div>
  );
}
