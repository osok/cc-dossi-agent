import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectStore } from '../services/project-store.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

let tmpDir: string;
let store: ProjectStore;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'project-store-test-'));
  store = new ProjectStore(tmpDir);
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('ProjectStore', () => {
  // B-PS-001: create() generates UUID and initializes project
  it('creates a project with UUID and timestamps', async () => {
    const project = await store.create('Test Project');

    expect(project.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(project.name).toBe('Test Project');
    expect(project.created_at).toBeTruthy();
    expect(project.updated_at).toBeTruthy();
    expect(project.agents).toEqual([]);
    expect(project.relationships).toEqual([]);
    expect(project.settings.selected_style).toBe('realistic_human');
  });

  // B-PS-002: list() returns sorted project summaries
  it('lists projects sorted by updated_at (most recent first)', async () => {
    const p1 = await store.create('First');
    // Small delay to ensure different timestamps
    await new Promise(r => setTimeout(r, 10));
    const p2 = await store.create('Second');

    const list = await store.list();
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('Second');
    expect(list[1].name).toBe('First');
    expect(list[0].agent_count).toBe(0);
  });

  // B-PS-003: get() returns full project data
  it('gets full project data by ID', async () => {
    const created = await store.create('Get Test');
    const loaded = await store.get(created.id);

    expect(loaded.id).toBe(created.id);
    expect(loaded.name).toBe('Get Test');
    expect(loaded.agents).toEqual([]);
  });

  // B-PS-004: update() merges data and updates timestamp
  it('updates project data and timestamp', async () => {
    const project = await store.create('Update Test');
    const originalTime = project.updated_at;

    await new Promise(r => setTimeout(r, 10));
    const updated = await store.update(project.id, { name: 'Updated Name' });

    expect(updated.name).toBe('Updated Name');
    expect(updated.updated_at).not.toBe(originalTime);
    expect(updated.id).toBe(project.id); // ID unchanged
    expect(updated.created_at).toBe(project.created_at); // created_at unchanged
  });

  // B-PS-005: delete() removes project directory
  it('deletes project directory', async () => {
    const project = await store.create('Delete Test');
    await store.delete(project.id);

    await expect(store.get(project.id)).rejects.toThrow();
  });

  // B-PS-006: validatePath() prevents path traversal
  it('prevents path traversal in saveAgentFile', async () => {
    const project = await store.create('Traversal Test');

    await expect(
      store.saveAgentFile(project.id, '../../../etc/passwd', Buffer.from('evil'))
    ).rejects.toThrow('Path traversal detected');
  });

  // B-PS-007: sanitizeName() removes dangerous characters (tested via portrait paths)
  it('sanitizes agent names for filesystem use', async () => {
    const project = await store.create('Name Test');

    // getPortraitPath uses sanitizeName internally
    const result = await store.getPortraitPath(project.id, 'Agent/With\\Bad..Chars', 'realistic_human');
    // Should not throw - name is sanitized
    expect(result).toBeNull(); // Not cached yet
  });

  // B-PS-008: saveAgentFile() writes to correct path
  it('saves agent file to correct path', async () => {
    const project = await store.create('Save Test');
    const content = Buffer.from('# Agent File Content');
    await store.saveAgentFile(project.id, 'test-agent.md', content);

    const savedPath = path.join(tmpDir, 'projects', project.id, 'agents', 'test-agent.md');
    const savedContent = await fs.readFile(savedPath, 'utf-8');
    expect(savedContent).toBe('# Agent File Content');
  });

  // B-PS-009: getPortraitPath() returns null when not cached
  it('returns null for uncached portrait', async () => {
    const project = await store.create('Portrait Test');
    const result = await store.getPortraitPath(project.id, 'Agent', 'realistic_human');
    expect(result).toBeNull();
  });

  // B-PS-010: savePortrait() creates directory and writes file
  it('saves portrait and creates directory', async () => {
    const project = await store.create('Portrait Save');
    const imageData = Buffer.from('fake-png-data');

    const savedPath = await store.savePortrait(project.id, 'Test Agent', 'anime', imageData);
    expect(savedPath).toContain('anime.png');

    const exists = await fs.access(savedPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  // Additional: validateProjectId rejects non-UUID IDs
  it('rejects non-UUID project IDs', async () => {
    await expect(store.get('not-a-uuid')).rejects.toThrow('Invalid project ID format');
    await expect(store.get('../traversal')).rejects.toThrow('Invalid project ID format');
    await expect(store.delete('drop table')).rejects.toThrow('Invalid project ID format');
  });

  // Additional: get() validates structural integrity
  it('rejects corrupted project data', async () => {
    const project = await store.create('Corrupt Test');
    const jsonPath = path.join(tmpDir, 'projects', project.id, 'project.json');
    await fs.writeFile(jsonPath, JSON.stringify({ bad: 'data' }));

    await expect(store.get(project.id)).rejects.toThrow('Corrupted project data');
  });

  // Additional: list() returns empty array when no projects
  it('returns empty array when no projects exist', async () => {
    const list = await store.list();
    expect(list).toEqual([]);
  });
});
