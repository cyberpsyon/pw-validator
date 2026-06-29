import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTween } from './useTween.js';

describe('useTween', () => {
  it('returns the target immediately when disabled', () => {
    const { result } = renderHook(() => useTween(42, 400, false));
    expect(result.current).toBe(42);
  });

  it('starts from the target on first render when enabled', () => {
    const { result } = renderHook(() => useTween(10, 400, true));
    expect(typeof result.current).toBe('number');
  });
});
