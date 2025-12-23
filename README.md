# ChatShell

A Codex-built Codex app. We used Codex to build an app that helps you use Codex better. Meta? Yes. Useful? Also yes.

ChatShell (Codex Canvas Workbench) is a local-first desktop workspace for refining a Task through chat, attaching context, and sending a compiled prompt to Codex CLI. Think of it as the missing control room between "idea" and "run".

## Why this is fun (and powerful)
- Codex built the scaffolding for ChatShell.
- ChatShell then uses Codex to refine its own prompts.
- You can watch the loop happen in real time.

## What you get
- Chat -> Task workflow with explicit PatchOps
- Local-first data model (no cloud by default)
- Settings stored in OS keychain
- Codex CLI execution from the app

## Quick start
```bash
cd app
npm install
npm run dev
```

## How it works
1. Chat to explore and refine the Task.
2. Toggle "Propose to Canvas" to apply Task updates.
3. Add attachments or URLs only when they matter.
4. Send to Codex and watch the terminal stream.

## The meta loop (built with Codex)
- The PRD, architecture, and UI spec live in the root.
- The app obeys those docs while using Codex for chat and execution.
- You can evolve the specs and let Codex keep building.

## Repo structure
```
app/                     # Electron + React + TypeScript app
codex_canvas_workbench_prd_v_1.md
codex_canvas_workbench_software_architecture_locked.md
codex_canvas_workbench_ui_ux_specification_locked.md
```

## Contributing
See `CONTRIBUTING.md` for workflow and expectations.

## License
MIT (see `LICENSE`).
