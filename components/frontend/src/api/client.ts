import { useSettingsStore } from '../stores/settingsStore';

/**
 * API error with status code and parsed error body.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Build request headers including API keys from settings store.
 */
function buildHeaders(
  contentType?: string
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const { anthropicKey, openaiKey } = useSettingsStore.getState();

  if (anthropicKey) {
    headers['x-anthropic-key'] = anthropicKey;
  }

  if (openaiKey) {
    headers['x-openai-key'] = openaiKey;
  }

  return headers;
}

/**
 * Make a JSON API request with error handling.
 */
export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const { method = 'GET', body, signal } = options;

  const headers = buildHeaders(
    body !== undefined ? 'application/json' : undefined
  );

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    const message =
      typeof errorBody === 'object' &&
      errorBody !== null &&
      'error' in errorBody
        ? String((errorBody as Record<string, unknown>).error)
        : `API request failed with status ${response.status}`;

    throw new ApiError(response.status, message, errorBody);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Upload files via multipart form data.
 */
export async function apiUpload<T>(
  path: string,
  files: File[],
  fieldName = 'files',
  signal?: AbortSignal
): Promise<T> {
  const formData = new FormData();
  for (const file of files) {
    formData.append(fieldName, file);
  }

  const headers = buildHeaders();
  // Do not set Content-Type for FormData; browser sets it with boundary

  const response = await fetch(path, {
    method: 'POST',
    headers,
    body: formData,
    signal,
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    const message =
      typeof errorBody === 'object' &&
      errorBody !== null &&
      'error' in errorBody
        ? String((errorBody as Record<string, unknown>).error)
        : `Upload failed with status ${response.status}`;

    throw new ApiError(response.status, message, errorBody);
  }

  return response.json() as Promise<T>;
}
