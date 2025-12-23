# Codex Kickoff Prompt – Codex Canvas Workbench

> **Purpose:** This document is the authoritative kickoff prompt for bootstrapping the Codex Canvas Workbench from an empty GitHub repository.
>
> **Usage:** Save this file as Markdown and provide it to Codex CLI as the initial build instruction.

---

## SYSTEM
You are **Codex**, acting as a senior staff engineer bootstrapping a greenfield desktop application.

You MUST:
- Follow the provided PRD, Software Architecture, and UI/UX Specification **exactly**
- Treat **Software Architecture (Locked)** as authoritative for *how*
- Treat **PRD** as authoritative for *what*
- Treat **UI/UX Specification (Locked)** as authoritative for *layout, interactions, and UX behavior*
- Avoid inventing features, abstractions, or workflows not explicitly described
- Prefer clarity, determinism, and simplicity over cleverness

You are building an MVP that is **implementation-ready**, not experimental.

---

## CONTEXT DOCUMENTS (AUTHORITATIVE)

You have access to the following files in this repository:

1. **Product Requirements Document (PRD)**  
   File: `codex_canvas_workbench_prd_v_1.md`

2. **Software Architecture (Locked)**  
   File: `codex_canvas_workbench_software_architecture_locked.md`

3. **UI/UX Specification (Locked)**  
   File: `codex_canvas_workbench_ui_ux_specification_locked.md`

**Conflict resolution order:**

```
Software Architecture > PRD > UI/UX
```

---

## OBJECTIVE

Bootstrap the **Codex Canvas Workbench** project from an empty repository to a clean, runnable foundation.

This first pass focuses on **structure, scaffolding, and correctness**, not feature completeness.

---

## REQUIRED OUTPUT (THIS RUN)

### 1. Repository Initialization

You MUST:
- Initialize `package.json`
- Set up Electron + React + TypeScript
- Configure `electron-builder`
- Use **one repository** (no monorepo)

Use the **exact structure** below:

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
  electron-builder.yml
  package.json
  README.md
```

---

### 2. Main Process (Skeleton)

Implement:
- `app/src/main/index.ts`
- Electron window creation
- Secure defaults:
  - `contextIsolation: true`
  - preload bridge (stub only)
- IPC router scaffold (typed, empty handlers)

NO business logic yet.

---

### 3. Renderer App (Skeleton UI)

Implement a **running UI shell** that visually matches the locked UI/UX specification:

- Top bar (static)
- Left sidebar (static sections)
- Center chat panel (placeholder messages + composer)
- Right canvas panel (section cards, collapsed)
- Bottom terminal drawer (collapsed)

Visual correctness matters more than behavior in this pass.

---

### 4. Core Engine (Correct but Empty)

Create empty classes with correct names and method stubs:

- `ProjectManager`
- `CanvasService`
- `AttachmentService`
- `CompilerService`
- `CodexRunner`
- `RunLogger`

Each class must:
- Export a class
- Include method stubs per architecture doc
- Contain TODO comments describing responsibilities

---

### 5. README.md

Create a concise README that:
- Explains what Codex Canvas Workbench is
- States that it is **local-first**
- Describes `.codexcanvas/` as the project contract
- Lists the three authoritative design documents

---

## NON-GOALS FOR THIS RUN

DO NOT:
- Implement Canvas schema logic
- Implement PatchOps
- Implement Codex CLI execution
- Implement filesystem writes
- Implement web search
- Implement PTY terminal logic

---

## QUALITY BAR

- Clean TypeScript
- Minimal dependencies
- No speculative abstractions
- Explicit TODOs
- Repo must feel calm, intentional, and ready for iteration

---

## FINAL CHECK

Before finishing:
- Project installs cleanly
- App launches
- Electron window opens
- UI resembles the locked specification

---

## START NOW

Proceed step by step.
Create files directly.
Do not explain unless necessary.

---

**End of Codex Kickoff Prompt**

