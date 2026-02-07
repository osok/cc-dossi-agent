import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ClaudeModel, ImageModel, PortraitStyle } from '@agent-dossier/parser';

interface SettingsState {
  /** Anthropic API key (stored in sessionStorage only) */
  anthropicKey: string | null;
  /** OpenAI API key (stored in sessionStorage only) */
  openaiKey: string | null;
  /** Selected Claude model for enrichment */
  selectedModel: ClaudeModel;
  /** Selected portrait style */
  selectedStyle: PortraitStyle;
  /** Selected image generation model for portraits */
  selectedImageModel: ImageModel;

  // Actions
  setAnthropicKey: (key: string) => void;
  setOpenaiKey: (key: string) => void;
  setModel: (model: ClaudeModel) => void;
  setStyle: (style: PortraitStyle) => void;
  setImageModel: (model: ImageModel) => void;
  clearKeys: () => void;
  hasAnthropicKey: () => boolean;
  hasOpenaiKey: () => boolean;
  hasAllKeys: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      anthropicKey: null,
      openaiKey: null,
      selectedModel: 'claude-sonnet-4-5-20250929',
      selectedStyle: 'realistic_human',
      selectedImageModel: 'gpt-image-1.5',

      setAnthropicKey: (key) => set({ anthropicKey: key || null }),

      setOpenaiKey: (key) => set({ openaiKey: key || null }),

      setModel: (model) => set({ selectedModel: model }),

      setStyle: (style) => set({ selectedStyle: style }),

      setImageModel: (model) => set({ selectedImageModel: model }),

      clearKeys: () => set({ anthropicKey: null, openaiKey: null }),

      hasAnthropicKey: () => {
        const { anthropicKey } = get();
        return anthropicKey !== null && anthropicKey.length > 0;
      },

      hasOpenaiKey: () => {
        const { openaiKey } = get();
        return openaiKey !== null && openaiKey.length > 0;
      },

      hasAllKeys: () => {
        const state = get();
        return state.hasAnthropicKey() && state.hasOpenaiKey();
      },
    }),
    {
      name: 'agent-dossier-settings',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        anthropicKey: state.anthropicKey,
        openaiKey: state.openaiKey,
        selectedModel: state.selectedModel,
        selectedStyle: state.selectedStyle,
        selectedImageModel: state.selectedImageModel,
      }),
    }
  )
);
