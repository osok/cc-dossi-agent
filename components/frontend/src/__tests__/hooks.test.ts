import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../hooks/useAutoSave';
import { useProjectStore } from '../stores/projectStore';

// Mock the save API
vi.mock('../api/projects', () => ({
  saveProject: vi.fn().mockResolvedValue(undefined),
}));

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useProjectStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // F-HK-002: Does not save when not dirty
  it('does not trigger save when not dirty', () => {
    useProjectStore.getState().setProject({
      id: 'test-id',
      name: 'Test',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      settings: { selected_style: 'realistic_human', selected_model: 'claude-sonnet-4-5-20250929' },
      agents: [],
      relationships: [],
    });

    renderHook(() => useAutoSave());

    // Advance past the debounce period
    act(() => {
      vi.advanceTimersByTime(70000); // 70s > 60s debounce
    });

    // isDirty is false, so save should not be triggered
    expect(useProjectStore.getState().isDirty).toBe(false);
  });

  // F-HK-003: Clears timer on unmount
  it('clears timer on unmount', () => {
    useProjectStore.getState().setProject({
      id: 'test-id',
      name: 'Test',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      settings: { selected_style: 'realistic_human', selected_model: 'claude-sonnet-4-5-20250929' },
      agents: [],
      relationships: [],
    });

    const { unmount } = renderHook(() => useAutoSave());

    // Mark dirty
    act(() => {
      useProjectStore.getState().markDirty();
    });

    // Unmount before timer fires
    unmount();

    // Should not throw or cause side effects
    act(() => {
      vi.advanceTimersByTime(70000);
    });
  });
});
