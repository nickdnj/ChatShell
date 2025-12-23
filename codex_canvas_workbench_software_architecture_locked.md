# Codex Canvas Workbench – Software Architecture (Locked)

## Version
- **Architecture Version:** v1.0 (Locked)
- **Status:** Approved for build
- **Scope:** MVP + explicit extension points

---

## 1. Design Decisions (Final)

### 1.1 Platform & Packaging
- **Framework:** Electron (cross‑platform)
- **Language:** TypeScript everywhere
- **UI:** React
- **Build/packaging:** electron-builder
- **Minimum OS targets:** macOS 13+, Windows 11 (Windows 10 best-effort), Ubuntu 22.04+

Rationale: fastest path to a polished desktop UX with a real PTY terminal and mature ecosystem.

### 1.2 Process Model
- **Electron Main Process** owns:
  - filesystem access
  - project initialization
  - canvas/history storage
  - compilation pipeline
  - Codex CLI execution (PTY)
  - run logging/transcripts
  - thumbnail generation & caching
  - web search (optional) via provider module
- **Renderer (React UI)** owns:
  - chat UI
  - canvas editor UI
  - diff/preview of operations
  - attachment picker UX
  - terminal rendering (xterm.js)

### 1.3 Engine Boundary
- Create a **Core Engine** module used only by Main process:
  - `@core/*` pure TypeScript (no DOM)
  - strict inputs/outputs, no UI concerns

Renderer communicates with Main via a **typed IPC API**.

### 1.4 Storage: Local‑First, Project‑Scoped
- All state lives under the selected project directory:
  - `.codexcanvas/` is the root of app state
- No cloud persistence in v1.

### 1.5 Canonical Data Model
- Canonical canvas format: **YAML** (`current.canvas.yaml`)
- History: full snapshot per revision
- Patch operations: JSON ops applied to in‑memory canvas then persisted
- Run records: JSON + transcript text

### 1.6 Terminal
- **Terminal UI:** xterm.js (renderer)
- **PTY:** node-pty (main)
- Terminal sessions are per project; Codex runs inside that PTY.

### 1.7 Codex CLI Invocation
- Default execution:
  - command: `codex`
  - args: `["exec"]`
  - cwd: project root
  - send compiled prompt via **stdin**
- Fallback mode (if stdin incompatible): write prompt to `.codexcanvas/compiled/latest.prompt.txt` and pass via `--prompt-file <path>` (or equivalent) **behind a configurable adapter**.

### 1.8 Web Search (Optional)
- Implement as a **pluggable provider** behind `WebSearchProvider` interface.
- v1 ships with a **stub provider** (disabled by default) unless a key/config is provided.
- The provider returns structured results with citation metadata; snippets are stored in Canvas.

### 1.9 Security Defaults
- Never upload project files by default.
- Secrets redaction runs during compilation.
- Attachment inlining is opt‑in; default is path reference.

---

## 2. High‑Level Architecture

### 2.1 Component Diagram (Logical)

- **UI (Renderer)**
  - Chat View
  - Canvas Editor
  - Attachment Tray
  - Run History View
  - Terminal View (xterm.js)

- **Main Process**
  - IPC Router (typed)
  - Project Manager
  - Canvas Service
  - Attachment Service
  - Compiler Service
  - Codex Runner (PTY)
  - Run Logger
  - Web Search Provider (optional)
  - Thumbnail/Preview Service

- **On Disk (.codexcanvas/)**
  - canvas (current + history)
  - compiled outputs
  - runs
  - assets
  - cache
  - logs

---

## 3. Directory & File Layout (Final)

```
<project_root>/
  .codexcanvas/
    config.json
    canvas/
      current.canvas.yaml
      history/
        cvs_<canvas_id>_rev001.canvas.yaml
        cvs_<canvas_id>_rev002.canvas.yaml
    compiled/
      latest.prompt.txt
      latest.compile.json
    runs/
      run_<run_id>.json
      run_<run_id>.transcript.txt
    assets/
      files/
      images/
    cache/
      thumbnails/
      web/
    logs/
      app.log
```

**Invariant:** any path stored in Canvas or Run records is **relative to project root**.

---

## 4. Data Models

### 4.1 Canvas (Canonical)
- Stored at: `.codexcanvas/canvas/current.canvas.yaml`
- Schema: PRD “Canvas Schema (v1)” (YAML)

### 4.2 Patch Operations
- Stored transiently in chat or UI state; applied via `CanvasService.applyOps()`
- Ops are validated (path exists / type correctness) before write

### 4.3 Run Record
- Stored at: `.codexcanvas/runs/run_<id>.json`
- Transcript stored alongside as `.transcript.txt`

---

## 5. Core Engine Modules

### 5.1 ProjectManager
Responsibilities:
- open/select project
- initialize `.codexcanvas/` if missing
- load config
- list canvases and runs

Key APIs:
- `openProject(path): ProjectHandle`
- `initProject(path): InitResult`
- `getRecentProjects(): ProjectSummary[]`

### 5.2 CanvasService
Responsibilities:
- load/save current canvas
- validate schema
- revision snapshots
- apply patch ops with diff preview support

Key APIs:
- `loadCurrent(): Canvas`
- `saveCurrent(canvas, reason): SaveResult`
- `snapshotRevision(canvas, reason): RevisionRef`
- `applyOps(canvas, ops): { nextCanvas, diff }`

### 5.3 AttachmentService
Responsibilities:
- ingest attachments (file/image/paste)
- choose mode: reference vs snapshot
- store snapshot under `.codexcanvas/assets/`
- compute hashes
- generate thumbnails for images

Default policy:
- inside project root → reference
- outside project root → snapshot
- images → snapshot unless already inside project

Key APIs:
- `addAttachment(input): AttachmentRecord`
- `resolvePath(attachment): AbsolutePath`
- `getThumbnail(attachmentId): ThumbnailPath`

### 5.4 CompilerService
Responsibilities:
- deterministic compilation from Canvas → prompt text
- enforce byte limits and truncation rules
- secrets redaction
- write `latest.prompt.txt` and `latest.compile.json`

Key APIs:
- `compile(canvas): CompileResult`

### 5.5 CodexRunner (PTY)
Responsibilities:
- create/manage PTY session per project
- run Codex CLI and stream output
- support interrupt/terminate
- record exit code

Key APIs:
- `startSession(projectRoot): SessionId`
- `runCodex(sessionId, commandSpec, prompt): RunHandle`
- `interrupt(runHandle)`
- `disposeSession(sessionId)`

### 5.6 RunLogger
Responsibilities:
- create run id
- write run metadata
- write transcript
- link run to canvas revision + compiled prompt hash

Key APIs:
- `startRun(meta): RunContext`
- `appendTranscript(runId, chunk)`
- `finalizeRun(runId, exitCode)`

### 5.7 WebSearchProvider (Optional)
Interface:
- `search(query, options): SearchResult[]`

SearchResult includes:
- title, url, snippet, retrieved_at, source_name

Implementation:
- v1: stub + interface; real providers added later

---

## 6. IPC Contract (Typed)

### 6.1 Principles
- Renderer never touches filesystem or spawns processes.
- Main process is the source of truth.
- IPC messages are typed and versioned.

### 6.2 IPC Domains
- `project.*`
- `canvas.*`
- `attachments.*`
- `compile.*`
- `codex.*`
- `runs.*`
- `web.*`
- `system.*`

### 6.3 Event Streams
- Terminal output: `codex.terminal.chunk`
- Run lifecycle: `runs.started`, `runs.finished`
- Canvas changed: `canvas.updated`

---

## 7. UX Architecture (State Ownership)

### 7.1 Source of Truth
- **Main process** holds canonical state on disk.
- Renderer holds:
  - view state
  - drafts (unsaved text)
  - operation previews

### 7.2 Chat + Canvas Interaction
- Chat supports research and exploration without mutating state.
- When explicitly requested, chat produces suggested **PatchOps**.
- UI renders diff preview for proposed ops.
- User can Apply / Reject / Edit.
- Applied ops update Canvas via `canvas.applyOps` then `canvas.saveCurrent`.

---

## 8. Attachment Flow (Final)

### 8.1 Ingestion
1. User adds attachment (picker/drag/drop/clipboard)
2. AttachmentService determines mode
3. If snapshot: copy to `.codexcanvas/assets/<type>/att_<id>__<name>`
4. Hash computed and stored in Canvas attachments registry
5. Optional: add to `context.files` / `context.images`

### 8.2 Usage in Compilation
- Compiler always emits an **Attachment Manifest**:
  - id, mime, stored_path, purpose, sha256
- Default include strategy: `reference`
- `inline_text` allowed for small text attachments when explicitly set
- Images are **never inlined** by default

### 8.3 Reproducibility
- Compile metadata records `sha256_at_compile` per referenced attachment.
- Phase 2 can create per‑run bundles; not required for v1.

---

## 9. Compilation Pipeline (Deterministic)

### 9.1 Ordering
1. `[SYSTEM]` prompt.system
2. `[INTENT]` intent.summary + desired_outcome
3. `[TASK]` prompt.task
4. `[CONSTRAINTS]` prompt.constraints
5. `[STYLE]` prompt.style
6. `[DELIVERABLES]` prompt.deliverables
7. `[ATTACHMENTS]` manifest
8. `[PROJECT CONTEXT]` files (full/excerpt) and image descriptions
9. `[WEB SOURCES]` citations/snippets

### 9.2 Limits
- `max_file_bytes`
- `max_total_bytes`
- Truncation priority (first to truncate): web → unpinned context → large file excerpts

### 9.3 Outputs
- `.codexcanvas/compiled/latest.prompt.txt`
- `.codexcanvas/compiled/latest.compile.json`:
  - hashes
  - bytes
  - truncations
  - attachment hashes at compile time

---

## 10. Codex Execution Pipeline

### 10.1 Run Sequence
1. `canvas.snapshotRevision(reason="send_to_codex")`
2. `compiler.compile(canvas)`
3. `runLogger.startRun(meta)`
4. `codexRunner.runCodex(prompt via stdin)`
5. stream terminal output → transcript
6. finalize run record

### 10.2 Interrupt Semantics
- First interrupt: SIGINT / Ctrl+C
- Second interrupt: SIGTERM
- Third (optional): SIGKILL (Linux/macOS) / force terminate on Windows

---

## 11. Observability
- `.codexcanvas/logs/app.log`
- Log levels: error/warn/info/debug
- No remote telemetry in v1.

---

## 12. Extension Points (Planned)
- Swap Electron → Tauri (future): preserve core engine APIs
- Web search providers: pluggable
- Additional model providers: pluggable
- Run bundles and diffs: add under `runs/<id>/bundle/`

---

## 13. Build Repository Layout (Final)

```
app/
  src/
    main/
      ipc/
      services/
      index.ts
    renderer/
      components/
      pages/
      state/
      index.tsx
    core/
      models/
      project/
      canvas/
      attachments/
      compile/
      runs/
  assets/
  package.json
  electron-builder.yml
  README.md
```

---

## 14. Acceptance Criteria for Architecture
- Renderer has no direct filesystem access.
- All on‑disk state is project‑scoped under `.codexcanvas/`.
- Canvas edits are versioned as immutable snapshots.
- Compilation is deterministic and writes both prompt and compile metadata.
- Codex runs in an embedded PTY terminal with interrupt support.

---

**End of Software Architecture (Locked)**
