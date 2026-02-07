import { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import * as projectsApi from '../../api/projects';
import * as agentsApi from '../../api/agents';
import { isDuplicateConflict } from '../../api/agents';
import type { ProjectSummary } from '@agent-dossier/parser';
import Button from '../common/Button';
import { formatDate } from '../../utils/format';
import styles from './ProjectDialog.module.css';

/**
 * Project management dialog: create, load, delete, upload agents.
 * Satisfies: FR-PROJ-001 to FR-PROJ-005, FR-PARSE-009 (upload)
 */
export default function ProjectDialog() {
  const showProjectDialog = useUIStore((s) => s.showProjectDialog);
  const closeProjectDialog = useUIStore((s) => s.closeProjectDialog);
  const setProject = useProjectStore((s) => s.setProject);
  const addAgents = useProjectStore((s) => s.addAgents);
  const setRelationships = useProjectStore((s) => s.setRelationships);
  const project = useProjectStore((s) => s.project);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'create'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Duplicate detection state (FR-PARSE-010)
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    duplicates: string[];
    files: File[];
  } | null>(null);

  // Load project list when dialog opens
  useEffect(() => {
    if (showProjectDialog) {
      loadProjects();
    }
  }, [showProjectDialog]);

  if (!showProjectDialog) return null;

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const list = await projectsApi.listProjects();
      setProjects(list);
    } catch (err) {
      setError(`Failed to load projects: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await projectsApi.createProject(newName.trim());
      setProject(created);
      setNewName('');
      closeProjectDialog();
    } catch (err) {
      setError(`Failed to create project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoad(id: string) {
    setLoading(true);
    setError(null);
    try {
      const loaded = await projectsApi.loadProject(id);
      setProject(loaded);
      closeProjectDialog();
    } catch (err) {
      setError(`Failed to load project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project and all its data?')) return;
    setLoading(true);
    setError(null);
    try {
      await projectsApi.deleteProject(id);
      if (project?.id === id) {
        setProject(null);
      }
      await loadProjects();
    } catch (err) {
      setError(`Failed to delete project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(files: FileList | File[], duplicateAction?: 'replace' | 'skip') {
    if (!project || files.length === 0) return;
    setLoading(true);
    setError(null);
    setDuplicatePrompt(null);
    try {
      const fileArray = files instanceof FileList ? Array.from(files) : files;
      const result = await agentsApi.uploadAgents(project.id, fileArray, duplicateAction);
      addAgents(result.agents);
      setRelationships(result.relationships);
      if (result.duplicates.length > 0 && duplicateAction === 'replace') {
        // Replaced agents are already in the result.agents array with updated data.
        // The store's addAgents only adds NEW agents; replaced ones need updateAgent.
        // Since the backend swaps them in-place, reload the full project to get updated state.
        const reloaded = await projectsApi.loadProject(project.id);
        setProject(reloaded);
      }
    } catch (err) {
      if (isDuplicateConflict(err)) {
        // Show duplicate prompt instead of error (FR-PARSE-010)
        const fileArray = files instanceof FileList ? Array.from(files) : files;
        setDuplicatePrompt({
          duplicates: err.body.duplicates,
          files: fileArray,
        });
      } else {
        setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicateReplace() {
    if (!duplicatePrompt) return;
    await handleUpload(duplicatePrompt.files, 'replace');
  }

  async function handleDuplicateSkip() {
    if (!duplicatePrompt) return;
    await handleUpload(duplicatePrompt.files, 'skip');
  }

  return (
    <div className={styles.overlay} onClick={closeProjectDialog}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Projects</h2>
          <button className={styles.closeButton} onClick={closeProjectDialog}>X</button>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <div className={styles.content}>
          {/* Tab bar for list vs create */}
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${view === 'list' ? styles.activeTab : ''}`}
              onClick={() => setView('list')}
            >
              Saved Projects
            </button>
            <button
              className={`${styles.tab} ${view === 'create' ? styles.activeTab : ''}`}
              onClick={() => setView('create')}
            >
              New Project
            </button>
          </div>

          {view === 'create' ? (
            <div className={styles.createForm}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name..."
                className={styles.input}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <Button variant="primary" onClick={handleCreate} loading={loading} disabled={!newName.trim()}>
                Create Project
              </Button>
            </div>
          ) : (
            <div className={styles.projectList}>
              {loading && projects.length === 0 ? (
                <p className={styles.emptyMessage}>Loading...</p>
              ) : projects.length === 0 ? (
                <p className={styles.emptyMessage}>No saved projects. Create one to get started.</p>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className={styles.projectItem}>
                    <div className={styles.projectInfo}>
                      <div className={styles.projectName}>{p.name}</div>
                      <div className={styles.projectMeta}>
                        {p.agent_count} agent{p.agent_count === 1 ? '' : 's'} | {formatDate(p.updated_at)}
                      </div>
                    </div>
                    <div className={styles.projectActions}>
                      <Button variant="primary" size="small" onClick={() => handleLoad(p.id)} loading={loading}>
                        Load
                      </Button>
                      <Button variant="danger" size="small" onClick={() => handleDelete(p.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Duplicate agent prompt (FR-PARSE-010) */}
          {duplicatePrompt && (
            <div className={styles.duplicatePrompt}>
              <h3 className={styles.sectionTitle}>Duplicate Agents Detected</h3>
              <p className={styles.sectionNote}>
                The following agent(s) already exist in this project:
              </p>
              <ul className={styles.duplicateList}>
                {duplicatePrompt.duplicates.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <div className={styles.duplicateActions}>
                <Button variant="primary" onClick={handleDuplicateReplace} loading={loading}>
                  Replace Existing
                </Button>
                <Button variant="secondary" onClick={handleDuplicateSkip} loading={loading}>
                  Skip Duplicates
                </Button>
                <Button variant="ghost" onClick={() => setDuplicatePrompt(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Upload section (shown when project is loaded) */}
          {project && !duplicatePrompt && (
            <div className={styles.uploadSection}>
              <h3 className={styles.sectionTitle}>Upload Agent Files</h3>
              <p className={styles.sectionNote}>
                Current project: {project.name} ({project.agents.length} agents)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md"
                multiple
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
                style={{ display: 'none' }}
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                loading={loading}
              >
                Choose .md Files
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
