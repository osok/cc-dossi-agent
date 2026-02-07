import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../components/stats/StatCard';
import type { AgentStats, EnrichmentData } from '@agent-dossier/parser';

const mockStats: AgentStats = {
  scope: 7,
  autonomy: 5,
  connections: 8,
  rigor: 6,
  complexity: 9,
};

const mockEnrichment: EnrichmentData = {
  codename: 'Shadow',
  personality_traits: ['analytical'],
  mission_briefing: 'Test mission',
  enhanced_relationships: {},
  stat_justifications: {
    scope: 'Handles many output types',
    autonomy: 'Moderate user interaction',
    connections: 'Connects to many agents',
    rigor: 'Extensive validation',
    complexity: 'Complex decision logic',
  },
};

describe('StatCard', () => {
  // F-STC-001: Renders radar chart (canvas element)
  it('renders radar chart with canvas element', () => {
    const { container } = render(<StatCard stats={mockStats} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  // F-STC-002: Shows stat values (title present)
  it('renders agent stats title', () => {
    render(<StatCard stats={mockStats} />);
    expect(screen.getByText('Agent Stats')).toBeInTheDocument();
  });

  // Shows justification text when enrichment provided
  it('shows justification breakdown when enrichment is provided', () => {
    render(<StatCard stats={mockStats} enrichment={mockEnrichment} />);

    expect(screen.getByText('Handles many output types')).toBeInTheDocument();
    expect(screen.getByText('Complex decision logic')).toBeInTheDocument();
    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByText('9/10')).toBeInTheDocument();
  });

  // No justifications when no enrichment
  it('does not show justifications when no enrichment', () => {
    render(<StatCard stats={mockStats} />);
    expect(screen.queryByText('Handles many output types')).not.toBeInTheDocument();
  });
});
