import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOutletContext } from 'react-router-dom';
import { vi } from 'vitest';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useOutletContext: vi.fn(),
}));

describe('useConnectionStatus', () => {
  it('should return isConnected from outlet context', () => {
    vi.mocked(useOutletContext).mockReturnValue({ isConnected: true });

    const { result } = renderHook(() => useConnectionStatus());

    expect(result.current).toBe(true);
  });

  it('should return false when not connected', () => {
    vi.mocked(useOutletContext).mockReturnValue({ isConnected: false });

    const { result } = renderHook(() => useConnectionStatus());

    expect(result.current).toBe(false);
  });

  it('should return false when context is undefined', () => {
    vi.mocked(useOutletContext).mockReturnValue({});

    const { result } = renderHook(() => useConnectionStatus());

    expect(result.current).toBe(false);
  });
});
