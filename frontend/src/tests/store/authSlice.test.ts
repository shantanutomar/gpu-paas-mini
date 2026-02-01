import { describe, it, expect, beforeEach } from 'vitest';
import authReducer, { setApiKey, clearApiKey } from '../../store/authSlice';

describe('authSlice', () => {
  let initialState: ReturnType<typeof authReducer>;

  beforeEach(() => {
    initialState = {
      apiKey: null,
    };
  });

  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual({
      apiKey: null,
    });
  });

  it('should handle setApiKey', () => {
    const apiKey = 'test-api-key-123';
    const actual = authReducer(initialState, setApiKey(apiKey));

    expect(actual.apiKey).toBe(apiKey);
  });

  it('should handle clearApiKey', () => {
    const stateWithApiKey = {
      apiKey: 'test-api-key-123',
    };

    const actual = authReducer(stateWithApiKey, clearApiKey());

    expect(actual.apiKey).toBeNull();
  });

  it('should update apiKey when setApiKey is called multiple times', () => {
    let state = authReducer(initialState, setApiKey('first-key'));
    expect(state.apiKey).toBe('first-key');

    state = authReducer(state, setApiKey('second-key'));
    expect(state.apiKey).toBe('second-key');
  });
});
