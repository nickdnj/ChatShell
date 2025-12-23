# Codex Canvas Workbench – Product Requirements Document (PRD)

## Version
- **PRD Version:** v1.0
- **Status:** Architecture‑Aligned, Ready for Build
- **Audience:** Codex (primary builder), maintainers
- **Authoritative Architecture:** *Codex Canvas Workbench – Software Architecture (Locked) v1.0*

---

## 1. One‑liner
A cross‑platform, local‑first desktop application that enables users to assemble, version, and deterministically compile structured **Canvas prompts**—using chat, attachments, and web context—and execute them directly via **Codex CLI** in an embedded terminal scoped to a project directory.

---

## 2. Problem Statement
Current Codex workflows require users to:
- Iteratively refine prompts in ChatGPT
- Manually copy/paste prompts into Codex CLI
- Lose prompt structure, context, and execution history
- Lack reproducibility between prompt versions and code changes

This leads to inefficiency, ambiguity, and brittle workflows.

---

## 3. Product Vision
Codex Canvas Workbench provides a **single, authoritative workspace** where:
- The **Canvas** is the source of truth
- Chat supports **research and exploration** and can optionally *propose* changes, but never mutates the Canvas implicitly
- Prompts are structured, versioned, and replayable
- Codex executions are traceable to exact Canvas revisions

The product treats **prompt creation as a first‑class software artifact**.

---

## 4. Goals
- Eliminate copy/paste between ChatGPT and Codex CLI
- Make prompts deterministic, inspectable, and versioned
- Keep all state local and project‑scoped
- Preserve a ChatGPT‑like UX for interaction
- Provide a native embedded Codex execution environment

---

## 5. Non‑Goals (v1)
- IDE replacement
- Multi‑user collaboration
- Cloud sync or telemetry
- Git replacement (integration allowed, replication not)

---

## 6. Target Platforms
- macOS (primary)
- Windows (required)
- Linux (best effort)

**Implementation is fixed:** Electron + React + TypeScript, with strict Main/Renderer separation as defined in the locked architecture.

---

## 7. Core User Workflow (Locked)
1. User opens app and selects a project directory.
2. App initializes `.codexcanvas/` in that directory.
3. User chats, researches (optional), and attaches files/images.
4. Assistant may propose structured **Canvas Patch Operations** when asked.
5. User previews and applies changes to the Canvas.
6. User clicks **Send to Codex**.
7. Canvas revision is snapshotted.
8. Canvas is deterministically compiled into a Codex prompt.
9. Codex CLI executes in an embedded terminal (PTY).
10. Run metadata and transcript are recorded.
11. A **new working Canvas revision is branched** for continued work.

---

## 8. Feature Set (MVP – Locked)

### 8.1 Project Initialization
- Select project directory
- Create `.codexcanvas/` if missing
- Persist all app state locally
- Recent projects list

### 8.2 Canvas
- YAML‑backed canonical format
- Single active Canvas per project
- Immutable revision snapshots
- Branch‑on‑run behavior

### 8.3 Chat Interface
- ChatGPT‑style UI
- File and image attachments
- Chat supports research/exploration without changing the Canvas
- Assistant emits **PatchOps** only when asked to propose changes
- Diff preview before apply

### 8.4 Attachments
- Files, images, pasted text
- **Reference vs Snapshot** modes (default rules fixed)
- Central attachment registry in Canvas

### 8.5 Web Research (Optional)
- Pluggable provider (stubbed by default)
- Results stored with citation metadata
- Explicit insertion into Canvas context

### 8.6 Embedded Terminal
- xterm.js + node‑pty
- Codex CLI execution in project root
- Streaming output
- Interrupt / rerun support

### 8.7 Run History
- Timeline of Codex runs
- Each run linked to:
  - Canvas ID + revision
  - Compiled prompt hash
  - Transcript file

---

## 9. On‑Disk Project Contract (Invariant)

All application state is stored **inside the project directory**:

```
.codexcanvas/
  canvas/
  compiled/
  runs/
  assets/
  cache/
  logs/
```

All stored paths are **relative to project root**.

---

## 10. Canvas (Canonical Data Model)

- Canonical file: `.codexcanvas/canvas/current.canvas.yaml`
- Format: YAML
- Schema versioned (`schema_version: 1`)
- Full snapshot stored per revision

The Canvas schema is authoritative and must not be implicitly mutated by chat.

---

## 11. Attachment Management (Locked)

### 11.1 Attachment Modes

**Reference**
- File exists inside project root
- Not copied
- Path stored relative to project root

**Snapshot**
- File copied into `.codexcanvas/assets/`
- Immutable
- Default for:
  - Files outside project root
  - Images

### 11.2 Asset Layout

```
.codexcanvas/assets/
  files/
    att_<id>__<name>
  images/
    att_<id>__<name>
```

### 11.3 Codex Inclusion Rules
- Compiler always emits an **Attachment Manifest**
- Default: reference by path + description
- Inline text is opt‑in only
- Images are never inlined by default

---

## 12. Chat → Canvas Interaction Model

- Chat can be pure research or structured **Patch Operations**
- Supported ops (v1):
  - set
  - append
  - remove
  - add_context_file
  - add_attachment
- UI must preview diffs before apply
- User explicitly applies or rejects changes

---

## 13. Compilation Pipeline (Deterministic)

### 13.1 Ordering (Fixed)
1. SYSTEM
2. INTENT
3. TASK
4. CONSTRAINTS
5. STYLE
6. DELIVERABLES
7. ATTACHMENT MANIFEST
8. PROJECT CONTEXT
9. WEB SOURCES

### 13.2 Limits & Truncation
- Per‑file and total byte limits enforced
- Truncation priority:
  1. Web snippets
  2. Unpinned context
  3. Large file excerpts

### 13.3 Outputs
- `.codexcanvas/compiled/latest.prompt.txt`
- `.codexcanvas/compiled/latest.compile.json`

Compilation is deterministic for a given Canvas revision.

---

## 14. Codex Execution (Locked)

- Codex CLI invoked via PTY
- Prompt delivery:
  - **Primary:** stdin
  - **Fallback:** prompt file via adapter
- Working directory: project root
- Interrupt semantics:
  - SIGINT → SIGTERM → force terminate

---

## 15. Safety & Guardrails (MVP)
- Secrets redaction during compilation
- Heuristic warnings for destructive operations
- Inline attachment content requires explicit opt‑in

---

## 16. Acceptance Criteria (Build‑Blocking)
- Renderer has no filesystem or process access
- All state lives under `.codexcanvas/`
- Canvas revisions are immutable snapshots
- Every run is traceable to a Canvas revision
- Compilation output is deterministic
- Codex runs inside an embedded PTY terminal

---

## 17. Out of Scope (Deferred)
- Per‑run reproducibility bundles
- Git diff previews
- Multi‑canvas workflows
- Cloud sync or sharing

---

**End of PRD (v1.0 – Architecture‑Aligned)**
