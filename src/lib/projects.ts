import { nanoid } from "nanoid";
import { getDb } from "./db";
import {
  DEFAULT_ENGINE,
  getEngine,
  isEngineId,
  type EngineId,
} from "./engines";
import { getTemplate } from "./templates";
import {
  ensureProjectDirs,
  readSource,
  removeProjectFiles,
  writeSource,
} from "./storage";

export interface Project {
  id: string;
  name: string;
  engine: EngineId;
  template: string | null;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number | null;
}

export interface ProjectWithSource {
  project: Project;
  source: string;
}

interface ProjectRow {
  id: string;
  name: string;
  engine: string;
  template: string | null;
  pinned: number;
  created_at: number;
  updated_at: number;
  last_opened_at: number | null;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    engine: isEngineId(row.engine) ? row.engine : DEFAULT_ENGINE,
    template: row.template,
    pinned: row.pinned === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastOpenedAt: row.last_opened_at,
  };
}

export interface CreateProjectInput {
  name?: string;
  engine?: string;
  templateId?: string;
}

export function createProject(input: CreateProjectInput = {}): Project {
  const db = getDb();
  const id = nanoid(12);
  const now = Date.now();

  // the engine comes from an explicit choice, otherwise the template's engine,
  // otherwise the default
  const template = input.templateId ? getTemplate(input.templateId) : undefined;
  const engineId: EngineId =
    input.engine && isEngineId(input.engine)
      ? input.engine
      : template
        ? template.engine
        : DEFAULT_ENGINE;
  const engine = getEngine(engineId);

  const name =
    input.name?.trim() || (template ? template.name : "Untitled Document");

  ensureProjectDirs(id);
  writeSource(id, engine, template ? template.source : engine.blankSource);

  db.prepare(
    `INSERT INTO projects (id, name, engine, template, created_at, updated_at, last_opened_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, name, engineId, template?.id ?? null, now, now, null);

  return toProject({
    id,
    name,
    engine: engineId,
    template: template?.id ?? null,
    pinned: 0,
    created_at: now,
    updated_at: now,
    last_opened_at: null,
  });
}

export function listProjects(): Project[] {
  // pinned projects float to the top, then most recently opened or edited first
  const rows = getDb()
    .prepare(
      `SELECT * FROM projects
       ORDER BY pinned DESC, COALESCE(last_opened_at, updated_at) DESC`,
    )
    .all() as ProjectRow[];
  return rows.map(toProject);
}

export function getProject(id: string): Project | null {
  const row = getDb().prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as
    | ProjectRow
    | undefined;
  return row ? toProject(row) : null;
}

export function getProjectWithSource(id: string): ProjectWithSource | null {
  const project = getProject(id);
  if (!project) return null;
  return { project, source: readSource(id, getEngine(project.engine)) };
}

export function renameProject(id: string, name: string): Project | null {
  const project = getProject(id);
  if (!project) return null;
  getDb()
    .prepare(`UPDATE projects SET name = ?, updated_at = ? WHERE id = ?`)
    .run(name.trim() || project.name, Date.now(), id);
  return getProject(id);
}

export function saveSource(id: string, content: string): Project | null {
  const project = getProject(id);
  if (!project) return null;
  writeSource(id, getEngine(project.engine), content);
  getDb()
    .prepare(`UPDATE projects SET updated_at = ? WHERE id = ?`)
    .run(Date.now(), id);
  return getProject(id);
}

export function setPinned(id: string, pinned: boolean): Project | null {
  const project = getProject(id);
  if (!project) return null;
  getDb()
    .prepare(`UPDATE projects SET pinned = ? WHERE id = ?`)
    .run(pinned ? 1 : 0, id);
  return getProject(id);
}

// bump last_opened_at so the dashboard can surface recently opened projects
export function touchProject(id: string): void {
  getDb()
    .prepare(`UPDATE projects SET last_opened_at = ? WHERE id = ?`)
    .run(Date.now(), id);
}

export function deleteProject(id: string): boolean {
  const project = getProject(id);
  if (!project) return false;
  getDb().prepare(`DELETE FROM projects WHERE id = ?`).run(id);
  removeProjectFiles(id);
  return true;
}
