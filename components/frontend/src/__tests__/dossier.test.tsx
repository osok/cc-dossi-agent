import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DossierSections from '../components/dossier/DossierSections';
import ClassifiedStamp from '../components/dossier/ClassifiedStamp';
import type { AgentData } from '@agent-dossier/parser';

const mockAgent: AgentData = {
  id: 'agent-1',
  filename: 'test.md',
  raw_markdown: '# Test',
  frontmatter: {
    name: 'Test Agent',
    description: 'A test agent',
    tools: ['Read', 'Write'],
  },
  mapped_sections: {
    behavior: {
      heading: 'Behavior',
      level: 2,
      content: 'This agent performs testing tasks.',
      tables: [],
      codeBlocks: [],
    },
    constraints: {
      heading: 'Constraints',
      level: 2,
      content: 'Must follow rules.',
      tables: [],
      codeBlocks: [],
    },
    key_decisions: {
      heading: 'Key Decision Areas',
      level: 2,
      content: 'How to prioritize.',
      tables: [{
        headers: ['Column A', 'Column B'],
        rows: [['cell1', 'cell2'], ['cell3', 'cell4']],
      }],
      codeBlocks: [],
    },
  },
  communication: { talks_to: [], receives_from: [] },
  stats: { scope: 5, autonomy: 5, connections: 5, rigor: 5, complexity: 5 },
  enrichment: null,
  portraits: {},
  phase: 'testing',
};

describe('DossierSections', () => {
  // F-DOS-004: Renders all present sections
  it('renders all present sections', () => {
    render(<DossierSections agent={mockAgent} />);

    expect(screen.getByText('Behavior')).toBeInTheDocument();
    expect(screen.getByText('Constraints')).toBeInTheDocument();
    expect(screen.getByText('Key Decision Areas')).toBeInTheDocument();
  });

  // F-DOS-005: Sections are collapsible
  it('sections are collapsible', () => {
    render(<DossierSections agent={mockAgent} />);

    // Content should be visible initially
    expect(screen.getByText(/performs testing tasks/)).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByText('Behavior'));

    // Content should be hidden
    expect(screen.queryByText(/performs testing tasks/)).not.toBeInTheDocument();
  });

  // F-DOS-006: Renders tables as HTML tables
  it('renders tables as HTML tables', () => {
    render(<DossierSections agent={mockAgent} />);

    expect(screen.getByText('Column A')).toBeInTheDocument();
    expect(screen.getByText('cell1')).toBeInTheDocument();
    expect(screen.getByText('cell4')).toBeInTheDocument();
  });

  // AI Enhanced badge shown when enriched
  it('shows AI Enhanced badge when agent has enrichment', () => {
    const enrichedAgent: AgentData = {
      ...mockAgent,
      enrichment: {
        codename: 'Shadow',
        personality_traits: ['careful'],
        mission_briefing: 'Test mission briefing text.',
        enhanced_relationships: {},
        stat_justifications: { scope: '5', autonomy: '5', connections: '5', rigor: '5', complexity: '5' },
      },
    };

    render(<DossierSections agent={enrichedAgent} />);

    expect(screen.getByText('AI Enhanced')).toBeInTheDocument();
    expect(screen.getByText(/Test mission briefing/)).toBeInTheDocument();
  });

  // No AI Enhanced badge when not enriched
  it('does not show AI Enhanced badge when not enriched', () => {
    render(<DossierSections agent={mockAgent} />);
    expect(screen.queryByText('AI Enhanced')).not.toBeInTheDocument();
  });
});

describe('ClassifiedStamp', () => {
  // F-DOS-007: Renders stamp text
  it('renders classified stamp text', () => {
    render(<ClassifiedStamp />);
    expect(screen.getByText(/CLASSIFIED/)).toBeInTheDocument();
  });
});
