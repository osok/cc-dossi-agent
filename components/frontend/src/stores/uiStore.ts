import { create } from 'zustand';

interface BatchProgress {
  current: number;
  total: number;
  label: string;
}

interface UIState {
  /** Currently active tab: agent ID, 'relationship-map', or 'pipeline' */
  activeTab: string;
  /** Whether the settings panel is visible */
  showSettings: boolean;
  /** Whether the project dialog is visible */
  showProjectDialog: boolean;
  /** Batch operation progress (null when no batch is running) */
  batchProgress: BatchProgress | null;
  /** Per-key loading states (e.g., agentId -> loading for enrichment/portrait) */
  loadingStates: Record<string, boolean>;

  // Actions
  setActiveTab: (tab: string) => void;
  toggleSettings: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleProjectDialog: () => void;
  openProjectDialog: () => void;
  closeProjectDialog: () => void;
  setBatchProgress: (current: number, total: number, label: string) => void;
  clearBatchProgress: () => void;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
}

export const useUIStore = create<UIState>()((set, get) => ({
  activeTab: '',
  showSettings: false,
  showProjectDialog: false,
  batchProgress: null,
  loadingStates: {},

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),

  toggleProjectDialog: () =>
    set((s) => ({ showProjectDialog: !s.showProjectDialog })),
  openProjectDialog: () => set({ showProjectDialog: true }),
  closeProjectDialog: () => set({ showProjectDialog: false }),

  setBatchProgress: (current, total, label) =>
    set({ batchProgress: { current, total, label } }),

  clearBatchProgress: () => set({ batchProgress: null }),

  setLoading: (key, loading) =>
    set((s) => ({
      loadingStates: { ...s.loadingStates, [key]: loading },
    })),

  isLoading: (key) => get().loadingStates[key] ?? false,
}));
