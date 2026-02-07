/**
 * Trigger PDF export for a project.
 * Returns the PDF as a Blob for browser download.
 */
export async function exportPdf(
  projectId: string,
  options?: {
    agent_ids?: string[];
    include_cover?: boolean;
  }
): Promise<Blob> {
  const { agent_ids, include_cover = true } = options ?? {};

  // We need to import settings store to get API keys
  const { useSettingsStore } = await import('../stores/settingsStore');
  const { anthropicKey, openaiKey } = useSettingsStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (anthropicKey) headers['x-anthropic-key'] = anthropicKey;
  if (openaiKey) headers['x-openai-key'] = openaiKey;

  const response = await fetch(`/api/projects/${projectId}/export/pdf`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ agent_ids, include_cover }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PDF export failed: ${error}`);
  }

  return response.blob();
}

/**
 * Trigger browser download of a Blob as a named file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
