import { useEffect, useCallback, useState } from 'react';
import { useProjectStore } from './stores/projectStore';
import { useUIStore } from './stores/uiStore';
import { useSettingsStore } from './stores/settingsStore';
import { useAutoSave } from './hooks/useAutoSave';
import TopBar from './components/layout/TopBar';
import StyleBar from './components/layout/StyleBar';
import TabNav from './components/layout/TabNav';
import DossierPage from './components/dossier/DossierPage';
import PortraitDisplay from './components/portrait/PortraitDisplay';
import PortraitPlaceholder from './components/portrait/PortraitPlaceholder';
import StatCard from './components/stats/StatCard';
import RelationshipMap from './components/relationship/RelationshipMap';
import PipelineView from './components/pipeline/PipelineView';
import SettingsPanel from './components/settings/SettingsPanel';
import ProjectDialog from './components/project/ProjectDialog';
import ProgressBar from './components/common/ProgressBar';
import ErrorBanner from './components/common/ErrorBanner';
import { getPortraitUrl } from './api/portraits';
import { enrichAgent, reparseAgents } from './api/agents';
import { generatePortrait, batchGeneratePortraits } from './api/portraits';
import { exportPdf, downloadBlob } from './api/pdf';
import { PORTRAIT_STYLES } from '@agent-dossier/parser';
import type { PortraitStyle } from '@agent-dossier/parser';

/**
 * Root application component.
 * Integrates all layout, dossier, map, pipeline, settings, and project components.
 * Satisfies: FR-DOSSIER-001 (SPA), all integration requirements.
 */
export default function App() {
  const project = useProjectStore((s) => s.project);
  const error = useProjectStore((s) => s.error);
  const setError = useProjectStore((s) => s.setError);
  const updateAgent = useProjectStore((s) => s.updateAgent);
  const setRelationships = useProjectStore((s) => s.setRelationships);
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const batchProgress = useUIStore((s) => s.batchProgress);
  const selectedStyle = useSettingsStore((s) => s.selectedStyle);
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const selectedImageModel = useSettingsStore((s) => s.selectedImageModel);

  const setBatchProgress = useUIStore((s) => s.setBatchProgress);
  const clearBatchProgress = useUIStore((s) => s.clearBatchProgress);

  // Per-agent loading states
  const [enrichLoading, setEnrichLoading] = useState<Record<string, boolean>>({});
  const [portraitLoading, setPortraitLoading] = useState<Record<string, boolean>>({});
  const [pdfLoading, setPdfLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  // Auto-save
  useAutoSave();

  // Set first agent tab as active when project loads
  useEffect(() => {
    if (project && project.agents.length > 0 && !activeTab) {
      setActiveTab(project.agents[0].id);
    }
  }, [project, activeTab, setActiveTab]);

  // Find active agent
  const activeAgent = project?.agents.find((a) => a.id === activeTab) ?? null;
  const activeAgentIndex = project?.agents.findIndex((a) => a.id === activeTab) ?? -1;

  // Enrich handler
  const handleEnrich = useCallback(async (agentId: string) => {
    if (!project) return;
    setEnrichLoading((prev) => ({ ...prev, [agentId]: true }));
    try {
      const result = await enrichAgent(agentId, project.id, selectedModel);
      updateAgent(agentId, {
        enrichment: result.enrichment,
        stats: result.stats,
      });
    } catch (err) {
      setError(`Enrichment failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setEnrichLoading((prev) => ({ ...prev, [agentId]: false }));
    }
  }, [project, selectedModel, updateAgent, setError]);

  // Portrait generation handler
  const handleGeneratePortrait = useCallback(async (agentId: string, regenerate = false) => {
    if (!project) return;
    setPortraitLoading((prev) => ({ ...prev, [agentId]: true }));
    try {
      const result = await generatePortrait(agentId, project.id, selectedStyle, regenerate, selectedImageModel);
      const agent = project.agents.find((a) => a.id === agentId);
      if (agent) {
        updateAgent(agentId, {
          portraits: { ...agent.portraits, [selectedStyle]: result.portrait_url },
        });
      }
    } catch (err) {
      setError(`Portrait generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPortraitLoading((prev) => ({ ...prev, [agentId]: false }));
    }
  }, [project, selectedStyle, selectedImageModel, updateAgent, setError]);

  // PDF export handler
  const handleExportPdf = useCallback(async (agentIds?: string[]) => {
    if (!project) return;
    setPdfLoading(true);
    try {
      const blob = await exportPdf(project.id, { agent_ids: agentIds });
      downloadBlob(blob, `${project.name}-dossier.pdf`);
    } catch (err) {
      setError(`PDF export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPdfLoading(false);
    }
  }, [project, setError]);

  // Batch: generate all portraits for current style
  const handleBatchPortraits = useCallback(async () => {
    if (!project || batchLoading) return;
    setBatchLoading(true);
    setBatchProgress(0, project.agents.length, `Generating ${PORTRAIT_STYLES[selectedStyle].displayName} portraits`);
    try {
      const result = await batchGeneratePortraits(project.id, selectedStyle, undefined, selectedImageModel);
      for (const r of result.results) {
        if (r.status === 'success' && r.portrait_url) {
          updateAgent(r.agent_id, { portraits: { ...project.agents.find(a => a.id === r.agent_id)?.portraits, [selectedStyle]: r.portrait_url } });
        }
      }
      if (result.failed > 0) {
        setError(`Batch portraits: ${result.failed} of ${result.total} failed`);
      }
    } catch (err) {
      setError(`Batch portrait generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBatchLoading(false);
      clearBatchProgress();
    }
  }, [project, selectedStyle, selectedImageModel, batchLoading, updateAgent, setError, setBatchProgress, clearBatchProgress]);

  // Batch: generate all portraits for ALL styles
  const handleBatchAllStyles = useCallback(async () => {
    if (!project || batchLoading) return;
    setBatchLoading(true);
    const allStyles = Object.keys(PORTRAIT_STYLES) as PortraitStyle[];
    const totalOps = allStyles.length;
    let completedStyles = 0;
    try {
      for (const style of allStyles) {
        setBatchProgress(completedStyles, totalOps, `Generating ${PORTRAIT_STYLES[style].displayName} portraits`);
        const result = await batchGeneratePortraits(project.id, style, undefined, selectedImageModel);
        for (const r of result.results) {
          if (r.status === 'success' && r.portrait_url) {
            const agent = project.agents.find(a => a.id === r.agent_id);
            if (agent) {
              updateAgent(r.agent_id, { portraits: { ...agent.portraits, [style]: r.portrait_url } });
            }
          }
        }
        completedStyles++;
      }
      setBatchProgress(totalOps, totalOps, 'All portraits generated');
    } catch (err) {
      setError(`Batch all-styles failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBatchLoading(false);
      clearBatchProgress();
    }
  }, [project, selectedImageModel, batchLoading, updateAgent, setError, setBatchProgress, clearBatchProgress]);

  // Batch: enrich all agents
  const handleBatchEnrich = useCallback(async () => {
    if (!project || batchLoading) return;
    setBatchLoading(true);
    const agents = project.agents;
    let completed = 0;
    try {
      for (const agent of agents) {
        setBatchProgress(completed, agents.length, `Enriching ${agent.frontmatter.name}`);
        try {
          const result = await enrichAgent(agent.id, project.id, selectedModel);
          updateAgent(agent.id, {
            enrichment: result.enrichment,
            stats: result.stats,
          });
        } catch (err) {
          setError(`Enrichment failed for ${agent.frontmatter.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        completed++;
      }
      setBatchProgress(agents.length, agents.length, 'All agents enriched');
    } finally {
      setBatchLoading(false);
      clearBatchProgress();
    }
  }, [project, selectedModel, batchLoading, updateAgent, setError, setBatchProgress, clearBatchProgress]);

  // Re-parse all agents from raw markdown
  const handleReparse = useCallback(async () => {
    if (!project || batchLoading) return;
    setBatchLoading(true);
    try {
      const result = await reparseAgents(project.id);
      // Update all agents in store with re-parsed data
      for (const agent of result.agents) {
        updateAgent(agent.id, {
          mapped_sections: agent.mapped_sections,
          communication: agent.communication,
          frontmatter: agent.frontmatter,
          stats: agent.stats,
          phase: agent.phase,
        });
      }
      setRelationships(result.relationships);
    } catch (err) {
      setError(`Re-parse failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBatchLoading(false);
    }
  }, [project, batchLoading, updateAgent, setRelationships, setError]);

  // Cache-bust counter for regenerated portraits
  const [portraitVersion, setPortraitVersion] = useState<Record<string, number>>({});

  // Build portrait slot for active agent
  const buildPortraitSlot = (agentId: string, agentName: string, portraits: Partial<Record<PortraitStyle, string>>) => {
    const portraitPath = portraits[selectedStyle];
    if (portraitPath && project) {
      const version = portraitVersion[`${agentId}-${selectedStyle}`] || 0;
      const url = getPortraitUrl(project.id, agentName, selectedStyle) + (version ? `?v=${version}` : '');
      return (
        <PortraitDisplay
          imageUrl={url}
          agentName={agentName}
          onRegenerate={() => {
            handleGeneratePortrait(agentId, true).then(() => {
              setPortraitVersion((prev) => ({
                ...prev,
                [`${agentId}-${selectedStyle}`]: (prev[`${agentId}-${selectedStyle}`] || 0) + 1,
              }));
            });
          }}
          regenerating={portraitLoading[agentId] ?? false}
        />
      );
    }
    return (
      <PortraitPlaceholder
        agentName={agentName}
        onGenerate={() => handleGeneratePortrait(agentId)}
        loading={portraitLoading[agentId] ?? false}
      />
    );
  };

  return (
    <div className="app">
      <TopBar />
      <StyleBar
        onBatchPortraits={handleBatchPortraits}
        onBatchAllStyles={handleBatchAllStyles}
        onBatchEnrich={handleBatchEnrich}
        onReparse={handleReparse}
        batchLoading={batchLoading}
      />

      {/* Batch Progress */}
      {batchProgress && (
        <ProgressBar
          current={batchProgress.current}
          total={batchProgress.total}
          label={batchProgress.label}
        />
      )}

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Body: Sidebar + Content */}
      <div className="app-body">
        <TabNav />

        {/* Content Area */}
        <main className="app-content">
          {!project ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', fontFamily: 'var(--font-typewriter)' }}>
              <p style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-ink-faded)', marginBottom: 'var(--space-4)' }}>
                No project loaded
              </p>
              <p style={{ color: 'var(--color-ink-faded)' }}>
                Create a new project or load an existing one to begin.
              </p>
            </div>
          ) : project.agents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', fontFamily: 'var(--font-typewriter)' }}>
              <p style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-ink-faded)', marginBottom: 'var(--space-4)' }}>
                No agents uploaded
              </p>
              <p style={{ color: 'var(--color-ink-faded)' }}>
                Upload agent .md files to populate this dossier.
              </p>
            </div>
          ) : activeTab === 'relationship-map' ? (
            <RelationshipMap
              agents={project.agents}
              relationships={project.relationships}
              projectId={project.id}
              savedPositions={project.relationship_map_positions}
            />
          ) : activeTab === 'pipeline' ? (
            <PipelineView agents={project.agents} />
          ) : activeAgent ? (
            <DossierPage
              agent={activeAgent}
              index={activeAgentIndex}
              onEnrich={() => handleEnrich(activeAgent.id)}
              onExportPdf={() => handleExportPdf([activeAgent.id])}
              onGeneratePortrait={() => handleGeneratePortrait(activeAgent.id)}
              enrichLoading={enrichLoading[activeAgent.id] ?? false}
              portraitLoading={portraitLoading[activeAgent.id] ?? false}
              pdfLoading={pdfLoading}
              portraitSlot={buildPortraitSlot(
                activeAgent.id,
                activeAgent.frontmatter.name,
                activeAgent.portraits
              )}
              statSlot={
                <StatCard
                  stats={activeAgent.stats}
                  enrichment={activeAgent.enrichment}
                />
              }
            />
          ) : (
            <div style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--color-ink-faded)', padding: 'var(--space-8)', textAlign: 'center' }}>
              <p>Select an agent tab to view their dossier.</p>
            </div>
          )}
        </main>
      </div>

      {/* Overlays */}
      <SettingsPanel />
      <ProjectDialog />
    </div>
  );
}
