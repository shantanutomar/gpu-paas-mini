import { useOutletContext } from 'react-router-dom';

interface LayoutContext {
  isConnected: boolean;
}

/**
 * Hook to check if the user has a valid, connected API key
 * Used to disable actions and show appropriate messaging
 */
export function useConnectionStatus(): boolean {
  const context = useOutletContext<LayoutContext>();
  return context?.isConnected ?? false;
}
