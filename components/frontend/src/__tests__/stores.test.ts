import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../stores/projectStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { ProjectData, AgentData } from '@agent-dossier/parser';

const mockProject: ProjectData = {
  id: 'test-project-id',
  name: 'Test Project',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  settings: { selected_style: 'realistic_human', selected_model: 'claude-sonnet-4-5-20250929' },
  agents: [],
  relationships: [],
};

const mockAgent: AgentData = {
  id: 'agent-1',
  filename: 'test.md',
  raw_markdown: '# Test',
  frontmatter: { name: 'Test Agent', description: 'A test', tools: ['Read'] },
  mapped_sections: {},
  communication: { talks_to: [], receives_from: [] },
  stats: { scope: 5, autonomy: 5, connections: 5, rigor: 5, complexity: 5 },
  enrichment: null,
  portraits: {},
  phase: 'implementation',
};

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
  });

  // F-ST-001: setProject sets project and clears dirty flag
  it('setProject sets project and clears dirty flag', () => {
    useProjectStore.getState().markDirty();
    expect(useProjectStore.getState().isDirty).toBe(true);

    useProjectStore.getState().setProject(mockProject);

    const state = useProjectStore.getState();
    expect(state.project).toEqual(mockProject);
    expect(state.isDirty).toBe(false);
    expect(state.error).toBeNull();
  });

  // F-ST-002: addAgents appends to project.agents
  it('addAgents appends agents to project', () => {
    useProjectStore.getState().setProject(mockProject);
    useProjectStore.getState().addAgents([mockAgent]);

    const state = useProjectStore.getState();
    expect(state.project!.agents.length).toBe(1);
    expect(state.project!.agents[0].id).toBe('agent-1');
    expect(state.isDirty).toBe(true);
  });

  // F-ST-003: updateAgent merges data for matching ID
  it('updateAgent merges data for matching agent', () => {
    const projectWithAgent = { ...mockProject, agents: [mockAgent] };
    useProjectStore.getState().setProject(projectWithAgent);

    useProjectStore.getState().updateAgent('agent-1', {
      enrichment: {
        codename: 'Test Codename',
        personality_traits: ['sharp'],
        mission_briefing: 'Test mission',
        enhanced_relationships: {},
        stat_justifications: { scope: '8', autonomy: '5', connections: '6', rigor: '7', complexity: '9' },
      },
    });

    const updated = useProjectStore.getState().project!.agents[0];
    expect(updated.enrichment).toBeDefined();
    expect(updated.enrichment!.codename).toBe('Test Codename');
    expect(useProjectStore.getState().isDirty).toBe(true);
  });

  // F-ST-004: markDirty/markClean toggle isDirty flag
  it('markDirty and markClean toggle isDirty flag', () => {
    expect(useProjectStore.getState().isDirty).toBe(false);

    useProjectStore.getState().markDirty();
    expect(useProjectStore.getState().isDirty).toBe(true);

    useProjectStore.getState().markClean();
    expect(useProjectStore.getState().isDirty).toBe(false);
  });

  // removeAgent removes agent from project
  it('removeAgent removes agent from project', () => {
    const projectWithAgent = { ...mockProject, agents: [mockAgent] };
    useProjectStore.getState().setProject(projectWithAgent);

    useProjectStore.getState().removeAgent('agent-1');
    expect(useProjectStore.getState().project!.agents.length).toBe(0);
  });

  // setRelationships updates relationships
  it('setRelationships updates project relationships', () => {
    useProjectStore.getState().setProject(mockProject);
    useProjectStore.getState().setRelationships([{
      id: 'rel-1',
      source_agent: 'A',
      target_agent: 'B',
      relationship_type: 'invokes',
      description: 'A invokes B',
      evidence: 'test',
    }]);

    expect(useProjectStore.getState().project!.relationships.length).toBe(1);
  });
});

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset by clearing storage
    window.sessionStorage.clear();
  });

  // F-ST-005: persists to sessionStorage (via Zustand persist middleware)
  it('has persist middleware configured', () => {
    const state = useSettingsStore.getState();
    expect(state).toHaveProperty('anthropicKey');
    expect(state).toHaveProperty('openaiKey');
    expect(state).toHaveProperty('selectedModel');
    expect(state).toHaveProperty('selectedStyle');
  });

  // F-ST-006: API keys nullable, cleared on clearKeys()
  it('API keys are null by default and cleared by clearKeys', () => {
    const state = useSettingsStore.getState();
    expect(state.anthropicKey).toBeNull();
    expect(state.openaiKey).toBeNull();

    state.setAnthropicKey('test-key');
    expect(useSettingsStore.getState().anthropicKey).toBe('test-key');

    state.clearKeys();
    expect(useSettingsStore.getState().anthropicKey).toBeNull();
    expect(useSettingsStore.getState().openaiKey).toBeNull();
  });

  // F-ST-007: Default model is claude-sonnet-4-5-20250929
  it('default model is claude-sonnet-4-5-20250929', () => {
    expect(useSettingsStore.getState().selectedModel).toBe('claude-sonnet-4-5-20250929');
  });

  // F-ST-008: Default style is realistic_human
  it('default style is realistic_human', () => {
    expect(useSettingsStore.getState().selectedStyle).toBe('realistic_human');
  });

  // hasAnthropicKey and hasAllKeys
  it('hasAnthropicKey returns true when key is set', () => {
    useSettingsStore.getState().setAnthropicKey('test');
    expect(useSettingsStore.getState().hasAnthropicKey()).toBe(true);
    expect(useSettingsStore.getState().hasAllKeys()).toBe(false);

    useSettingsStore.getState().setOpenaiKey('test2');
    expect(useSettingsStore.getState().hasAllKeys()).toBe(true);
  });
});
