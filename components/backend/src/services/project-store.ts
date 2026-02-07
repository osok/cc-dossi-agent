import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ProjectData, ProjectSummary, PortraitStyle } from '@agent-dossier/parser';

/** UUID v4 regex for project ID validation */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Filesystem-based project persistence service.
 * Each project is stored in data/projects/{uuid}/ with:
 * - project.json: all structured data
 * - agents/: raw uploaded .md files
 * - portraits/{agent_name}/{style}.png: cached portrait images
 *
 * Satisfies: FR-PROJ-001 to FR-PROJ-006, ADR-006
 */
export class ProjectStore {
  constructor(private dataDir: string) {}

  private projectDir(id: string): string {
    return path.join(this.dataDir, 'projects', id);
  }

  private projectJsonPath(id: string): string {
    return path.join(this.projectDir(id), 'project.json');
  }

  /**
   * Sanitize agent name for filesystem use.
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100) || 'unnamed';
  }

  /**
   * Validate project ID is a valid UUID to prevent path traversal via ID.
   */
  private validateProjectId(id: string): void {
    if (!UUID_PATTERN.test(id)) {
      throw new Error('Invalid project ID format');
    }
  }

  /**
   * Validate that a resolved path stays within the project directory.
   * Prevents path traversal attacks (NFR-SEC-005).
   */
  private validatePath(projectId: string, resolvedPath: string): void {
    const base = path.resolve(this.projectDir(projectId));
    const resolved = path.resolve(resolvedPath);
    if (!resolved.startsWith(base)) {
      throw new Error('Path traversal detected');
    }
  }

  async create(name: string): Promise<ProjectData> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const project: ProjectData = {
      id,
      name,
      created_at: now,
      updated_at: now,
      settings: {
        selected_style: 'realistic_human',
        selected_model: 'claude-sonnet-4-5-20250929',
      },
      agents: [],
      relationships: [],
    };

    const dir = this.projectDir(id);
    await fs.mkdir(path.join(dir, 'agents'), { recursive: true });
    await fs.mkdir(path.join(dir, 'portraits'), { recursive: true });
    await fs.writeFile(this.projectJsonPath(id), JSON.stringify(project, null, 2));

    return project;
  }

  async list(): Promise<ProjectSummary[]> {
    const projectsDir = path.join(this.dataDir, 'projects');
    try {
      const entries = await fs.readdir(projectsDir, { withFileTypes: true });
      const summaries: ProjectSummary[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        try {
          const jsonPath = path.join(projectsDir, entry.name, 'project.json');
          const data = JSON.parse(await fs.readFile(jsonPath, 'utf-8')) as ProjectData;
          summaries.push({
            id: data.id,
            name: data.name,
            agent_count: data.agents.length,
            created_at: data.created_at,
            updated_at: data.updated_at,
          });
        } catch {
          // Skip corrupted projects
        }
      }

      return summaries.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    } catch {
      return [];
    }
  }

  async get(id: string): Promise<ProjectData> {
    this.validateProjectId(id);
    try {
      const data = await fs.readFile(this.projectJsonPath(id), 'utf-8');
      const parsed = JSON.parse(data);
      // Basic structural validation
      if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.name || !Array.isArray(parsed.agents)) {
        throw new Error('Corrupted project data');
      }
      return parsed as ProjectData;
    } catch (err) {
      if (err instanceof Error && err.message === 'Corrupted project data') throw err;
      throw new Error(`Project ${id} not found`);
    }
  }

  async update(id: string, data: Partial<ProjectData>): Promise<ProjectData> {
    this.validateProjectId(id);
    const existing = await this.get(id);
    // Only allow updating safe fields - never overwrite id or created_at
    const updated: ProjectData = {
      ...existing,
      name: data.name ?? existing.name,
      settings: data.settings ?? existing.settings,
      agents: data.agents ?? existing.agents,
      relationships: data.relationships ?? existing.relationships,
      relationship_map_positions: data.relationship_map_positions ?? existing.relationship_map_positions,
      updated_at: new Date().toISOString(),
    };
    await fs.writeFile(this.projectJsonPath(id), JSON.stringify(updated, null, 2));
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.validateProjectId(id);
    const dir = this.projectDir(id);
    await fs.rm(dir, { recursive: true, force: true });
  }

  async saveAgentFile(projectId: string, filename: string, content: Buffer): Promise<void> {
    this.validateProjectId(projectId);
    const filePath = path.join(this.projectDir(projectId), 'agents', filename);
    this.validatePath(projectId, filePath);
    await fs.writeFile(filePath, content);
  }

  async getPortraitPath(
    projectId: string,
    agentName: string,
    style: PortraitStyle
  ): Promise<string | null> {
    const safeName = this.sanitizeName(agentName);
    const filePath = path.join(
      this.projectDir(projectId),
      'portraits',
      safeName,
      `${style}.png`
    );
    this.validatePath(projectId, filePath);

    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      return null;
    }
  }

  async savePortrait(
    projectId: string,
    agentName: string,
    style: PortraitStyle,
    imageBuffer: Buffer
  ): Promise<string> {
    const safeName = this.sanitizeName(agentName);
    const dir = path.join(this.projectDir(projectId), 'portraits', safeName);
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${style}.png`);
    this.validatePath(projectId, filePath);
    await fs.writeFile(filePath, imageBuffer);

    return filePath;
  }
}
