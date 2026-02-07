import { apiRequest } from './client';

interface KeyValidationResult {
  valid: boolean;
  error?: string;
}

interface ValidateKeysResponse {
  anthropic?: KeyValidationResult;
  openai?: KeyValidationResult;
}

/**
 * Validate API keys by testing against their respective APIs.
 */
export function validateKeys(keys: {
  anthropic_key?: string;
  openai_key?: string;
}): Promise<ValidateKeysResponse> {
  return apiRequest<ValidateKeysResponse>('/api/settings/validate-keys', {
    method: 'POST',
    body: keys,
  });
}
