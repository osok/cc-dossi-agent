import { create } from 'zustand';
import type { ProjectData, AgentData, AgentRelationship } from '@agent-dossier/parser';

interface ProjectState {
  /** Currently loaded project data */
  project: ProjectData | null;
  /** Whether a project operation is in progress */
  isLoading: boolean;
  /** Whether there are unsaved changes (triggers auto-save) */
  isDirty: boolean;
  /** Current error message */
  error: string | null;

  // Actions
  setProject: (project: ProjectData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addAgents: (agents: AgentData[]) => void;
  updateAgent: (agentId: string, data: Partial<AgentData>) => void;
  removeAgent: (agentId: string) => void;
  setRelationships: (relationships: AgentRelationship[]) => void;
  updateMapPositions: (positions: Record<string, { x: number; y: number }>) => void;
  markDirty: () => void;
  markClean: () => void;
  reset: () => void;
}

const initialState = {
  project: null,
  isLoading: false,
  isDirty: false,
  error: null,
};

export const useProjectStore = create<ProjectState>()((set, get) => ({
  ...initialState,

  setProject: (project) => set({ project, isDirty: false, error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  addAgents: (agents) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        agents: [...project.agents, ...agents],
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  updateAgent: (agentId, data) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        agents: project.agents.map((a) =>
          a.id === agentId ? { ...a, ...data } : a
        ),
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  removeAgent: (agentId) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        agents: project.agents.filter((a) => a.id !== agentId),
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  setRelationships: (relationships) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        relationships,
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  updateMapPositions: (positions) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        relationship_map_positions: {
          ...project.relationship_map_positions,
          ...positions,
        },
        updated_at: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  markDirty: () => set({ isDirty: true }),

  markClean: () => set({ isDirty: false }),

  reset: () => set(initialState),
}));
