# Repository Guidelines

## Project Structure & Module Organization
- This repository currently contains specification documents only:
  - `codex_canvas_workbench_prd_v_1.md`
  - `codex_canvas_workbench_software_architecture_locked.md`
  - `codex_canvas_workbench_ui_ux_specification_locked.md`
  - `codex_canvas_workbench_codex_kickoff_prompt_v_1.md`
- The locked architecture defines the intended app layout once scaffolding starts:
  - `app/src/main/` (Electron main process)
  - `app/src/renderer/` (React UI)
  - `app/src/core/` (domain services/models)
  - `app/assets/` and top-level `app/package.json`, `app/electron-builder.yml`, `app/README.md`

## Build, Test, and Development Commands
- No build tooling is checked in yet (no `package.json` in the repo root).
- When the Electron + React scaffold is added under `app/`, define commands there (example location: `app/package.json`), and document them in `app/README.md`.

## Coding Style & Naming Conventions
- Follow the locked architecture and UI/UX spec as authoritative sources.
- Use TypeScript with clear module boundaries: `main` (IPC + services), `renderer` (UI), `core` (business logic).
- Prefer descriptive class names matching the architecture doc (e.g., `ProjectManager`, `CanvasService`).
- Keep files and directories lowercase with underscores only where already used in existing filenames.

## Testing Guidelines
- No testing framework is configured yet.
- Once tests exist, keep them co-located or under a dedicated `app/tests/` folder and document the runner and naming pattern (for example, `*.test.ts`).

## Commit & Pull Request Guidelines
- This repository is not a Git checkout, so there is no commit history to infer conventions from.
- When Git is initialized, use concise, imperative commit subjects (e.g., "Add renderer shell") and include context in the body when needed.
- For PRs, include a short summary, link to any tracked issues, and add screenshots for UI changes.

## Agent-Specific Instructions
- Treat `codex_canvas_workbench_software_architecture_locked.md` as authoritative for "how", and the PRD for "what".
- Avoid inventing features or workflows not present in the specification documents.
