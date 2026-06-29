import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the worker client and HIBP so the hook is testable without a real worker.
vi.mock('../lib/validatorClient.js', () => ({
  validateAsync: vi.fn(async (pw, hibp) => ({
    pw, score: hibp?.pending ? 80 : 100, hibpPending: !!hibp?.pending,
  })),
}));
vi.mock('../lib/hibp.js', () => ({
  checkHIBP: vi.fn(async () => ({ count: 0 })),
}));

import { useLiveValidation } from './useLiveValidation.js';
import { validateAsync } from '../lib/validatorClient.js';
import { checkHIBP } from '../lib/hibp.js';

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('useLiveValidation', () => {
  it('is empty with no password', () => {
    const { result } = renderHook(() => useLiveValidation(''));
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.result).toBeNull();
  });

  it('runs local validation after the local debounce, then HIBP', async () => {
    const { result, rerender } = renderHook(({ pw }) => useLiveValidation(pw, { localDelay: 120, hibpDelay: 600 }), {
      initialProps: { pw: 'abc' },
    });
    // before debounce fires, nothing yet
    expect(result.current.result).toBeNull();
    await act(async () => { await vi.advanceTimersByTimeAsync(120); });
    expect(validateAsync).toHaveBeenCalledWith('abc', { pending: true });
    expect(result.current.phase).toBe('checking');
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(checkHIBP).toHaveBeenCalledWith('abc');
    expect(result.current.phase).toBe('done');
    rerender({ pw: 'abc' });
  });

  it('ignores a stale run when the password changes mid-flight', async () => {
    let resolveHibp;
    checkHIBP.mockImplementationOnce(() => new Promise((r) => { resolveHibp = () => r({ count: 5 }); }));
    const { result, rerender } = renderHook(({ pw }) => useLiveValidation(pw, { localDelay: 0, hibpDelay: 0 }), {
      initialProps: { pw: 'old' },
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    rerender({ pw: 'new' });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { resolveHibp?.(); await Promise.resolve(); });
    // stale 'old' HIBP must not set phase to done for the 'new' run incorrectly
    expect(result.current.result?.pw).toBe('new');
  });
});
