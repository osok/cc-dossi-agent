import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, ApiError } from '../api/client';
import { useSettingsStore } from '../stores/settingsStore';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  useSettingsStore.setState({
    anthropicKey: 'test-anthropic',
    openaiKey: 'test-openai',
    selectedModel: 'claude-sonnet-4-5-20250929',
    selectedStyle: 'realistic_human',
  });
});

describe('apiRequest', () => {
  // F-API-001: Adds API key headers from settings store
  it('adds API key headers from settings store', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ result: 'ok' }),
    });

    await apiRequest('/api/test');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-anthropic-key': 'test-anthropic',
          'x-openai-key': 'test-openai',
        }),
      })
    );
  });

  // F-API-002: Handles 4xx/5xx with ApiError
  it('throws ApiError on 4xx/5xx responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    });

    await expect(apiRequest('/api/test')).rejects.toThrow(ApiError);
    try {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });
      await apiRequest('/api/test');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
      expect((err as ApiError).message).toBe('Not found');
    }
  });

  // F-API-003: Handles 204 No Content
  it('handles 204 No Content response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await apiRequest('/api/test', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });

  // Sends JSON body when provided
  it('sends JSON body when body is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ result: 'created' }),
    });

    await apiRequest('/api/test', {
      method: 'POST',
      body: { name: 'Test' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});
