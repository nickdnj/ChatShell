# Codex Canvas Workbench

Codex Canvas Workbench is a local-first desktop app for authoring, versioning, and deterministically compiling Canvas prompts, then running Codex CLI in an embedded terminal.

## Local-first Contract
All application state lives inside the selected project directory under `.codexcanvas/`. This folder is the on-disk contract for canvases, compiled prompts, runs, assets, and logs.

## UI Shell (Current)
- Top bar with project actions and Settings.
- Left sidebar includes Project metadata, a file browser stub, History, and Attachments.
- Right sidebar hosts collapsed Canvas section cards.
- Settings panel includes a placeholder OpenAI API key input (UI only).
- Send to Codex triggers a mocked run via IPC, with terminal output and a sample question/answer flow.

## Authoritative Documents
- `codex_canvas_workbench_prd_v_1.md`
- `codex_canvas_workbench_software_architecture_locked.md`
- `codex_canvas_workbench_ui_ux_specification_locked.md`
