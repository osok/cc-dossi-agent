import type { ImageModel } from '@agent-dossier/parser';

/**
 * OpenAI Image API client for portrait generation.
 *
 * Satisfies: FR-IMG-004, FR-IMG-013, DC-009, DC-010
 */
export class OpenAIClient {
  private baseUrl = 'https://api.openai.com/v1/images/generations';

  constructor(private apiKey: string) {}

  /**
   * Generate a portrait image.
   * Returns the image as a Buffer (PNG, 1024x1024).
   */
  async generateImage(prompt: string, model: ImageModel = 'gpt-image-1.5', maxRetries = 3): Promise<Buffer> {
    const isDalle = model === 'dall-e-3';
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size: '1024x1024',
          ...(isDalle
            ? { quality: 'hd', response_format: 'b64_json' }
            : { quality: 'high', output_format: 'png' }),
        }),
      });

      if (response.status === 429) {
        if (attempt === maxRetries) {
          throw new Error('Rate limited by OpenAI API');
        }
        const retryAfter = parseInt(response.headers.get('retry-after') || '10');
        const delay = Math.min(retryAfter * 1000, 60000) * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json() as {
        data: Array<{ b64_json?: string; url?: string }>;
      };

      if (data.data[0]?.b64_json) {
        return Buffer.from(data.data[0].b64_json, 'base64');
      }

      if (data.data[0]?.url) {
        const imageResponse = await fetch(data.data[0].url);
        const arrayBuffer = await imageResponse.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }

      throw new Error('No image data in OpenAI response');
    }

    throw new Error('Max retries exceeded for OpenAI API');
  }
}
