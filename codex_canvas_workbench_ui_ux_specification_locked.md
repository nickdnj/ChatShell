# Codex Canvas Workbench – UI/UX Specification (Locked)

## Version
- **UI/UX Spec Version:** v1.0 (Locked)
- **Status:** Approved for implementation
- **Design Goal:** “Feels like ChatGPT” — calm, minimal, fast, and obvious.

---

## 1. Core UX Principles

1. **Single primary action per moment**
   - While composing: *Send*
   - When ready: *Send to Codex*

2. **Reduce visible complexity**
   - Advanced controls are tucked behind a single “⋯” menu.

3. **Everything important is one click away**
   - Attach → appears instantly
   - Apply patch → one click
   - Send to Codex → one button

4. **The Canvas is always present, but never loud**
   - Canvas is visible as a clean, structured panel, not a complicated editor.

5. **Terminal is present, but not intrusive**
   - Collapsible bottom panel
   - Auto-opens on run

6. **Local-first clarity**
   - Always show the current project path (subtle)
   - Never imply cloud sync

---

## 2. App Shell Layout (Default)

### 2.1 Three-column + bottom drawer

```
┌─────────────────────────────────────────────────────────────────────┐
│ Top Bar: Project ▾   • Branch: main   • Status •   ⋯               │
├───────────────┬───────────────────────────────┬─────────────────────┤
│ Sidebar       │ Chat                           │ Canvas              │
│ (History)     │                               │ (Prompt Builder)    │
│               │                               │                     │
│ - Canvases    │  Messages (bubbles)           │  Sections           │
│ - Runs        │                               │  (editable cards)   │
│ - Files       │  Attachments inline           │                     │
│               │                               │  Compile Preview    │
├───────────────┴───────────────────────────────┴─────────────────────┤
│ Terminal Drawer (collapsed by default; opens on run)               │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Responsive rules
- **Narrow width:** Sidebar collapses into an icon rail; Canvas becomes a slide-over panel.
- **Tiny width:** Single-column: Chat first, Canvas reachable via a toggle.

---

## 3. Top Bar (Minimal)

### 3.1 Contents
- **Project selector** (left): “Project Name ▾”
- **Path hint** (secondary): `/Users/nick/.../repo`
- **Git context** (optional): branch name if detected
- **Status indicator** (right):
  - `● Idle` / `● Running` / `● Needs attention`
- **Overflow menu** (⋯): settings, diagnostics, about

### 3.2 No clutter
- No tabs. No toolbars. No dense icons.

---

## 4. Sidebar: History (Left)

### 4.1 Sections (accordion)
1. **Canvases**
   - Shows current canvas title + revision
   - History list (latest first)
   - Search by title
2. **Runs**
   - Run list with timestamp + exit status
   - Clicking a run opens transcript and the prompt used
3. **Files (Context)**
   - A small list of pinned context files/images
   - Clicking opens preview

### 4.2 Sidebar behavior
- Collapsible
- Remembers width

---

## 5. Chat View (Center) — “ChatGPT feel”

### 5.1 Message styling
- Calm, readable bubble layout
- User messages right-aligned
- Assistant messages left-aligned
- Code blocks: monospace, copy button
- Citations (web): subtle footnotes

### 5.2 Composer
A single input bar anchored to bottom:
- Text area (multi-line)
- **Attach** button (paperclip)
- Optional toggles (as icons, minimal):
  - Web search (globe)
- **Propose to Canvas** toggle (off by default)
- Primary **Send** button

### 5.3 Attachments in chat
- When attached, show “chips” in composer:
  - icon + filename + size
  - click to preview
  - x to remove

### 5.4 Chat actions (per assistant message)
- **Apply to Canvas** (primary)
- Copy
- Pin

(Only show actions on hover to keep clean.)

---

## 6. Canvas View (Right) — Structured, Minimal

### 6.1 Canvas as section cards
Canvas is rendered as **section cards**, each collapsible:
- System
- Intent
- Task
- Constraints
- Style
- Deliverables
- Attachments
- Context
- Web Sources

Each card:
- Title
- Short summary line (auto)
- Edit button
- Collapse toggle

### 6.2 Editing model
- Inline editing for small text
- Full editor modal for large text blocks
- Always autosave as draft; explicit “Save” commits a revision

### 6.3 Patch preview
When assistant proposes PatchOps:
- A **diff drawer** appears at top of Canvas:
  - shows changes grouped by section
  - Apply / Reject / Edit

### 6.4 Compile preview
A “Preview prompt” button at bottom of Canvas:
- Opens modal with compiled prompt text
- Shows truncation warnings and attachment manifest

### 6.5 The “Send to Codex” button
- Primary action button at bottom-right of Canvas panel
- Disabled until:
  - required fields present (Task)
- On click:
  - snapshot revision
  - compile
  - run Codex
  - open terminal drawer

---

## 7. Terminal Drawer (Bottom)

### 7.1 Behavior
- Collapsed by default
- Auto-opens when Codex is running
- Shows tabs only if multiple sessions are supported (v1: single)

### 7.2 Controls (minimal)
- Stop (interrupt)
- Clear
- Re-run last

### 7.3 Transcript integration
- Terminal output auto-saved
- A “View run details” link appears at end

---

## 8. Run Details (Overlay / Panel)

Opened from Runs list:
- Prompt used (compiled)
- Canvas revision link
- Transcript
- Exit status
- (Phase 2) file changes diff

---

## 9. Attachment UX (Critical)

### 9.1 Add attachment
- Paperclip → file picker
- Drag/drop anywhere in chat
- Paste image from clipboard

### 9.2 Mode selection (Reference vs Snapshot)
- Default computed automatically:
  - in project root → Reference
  - outside project root → Snapshot
  - images → Snapshot
- User can override per item via a dropdown on the attachment chip

### 9.3 Add to context prompt
After attaching:
- “Add to Canvas context?” toggle (default ON)

### 9.4 Attachment panel (within Canvas)
- Shows manifest list:
  - id, name, purpose, mode
  - open file
  - remove

---

## 10. Empty States

### 10.1 No project opened
- Centered friendly CTA:
  - “Open a folder to begin”

### 10.2 New canvas
- Canvas shows a short template + examples
- Chat suggests: “Describe what you want Codex to do.”

### 10.3 No runs yet
- Runs list shows: “No runs yet. Send to Codex when ready.”

---

## 11. Visual Design System (Tokenized)

### 11.1 Theme
- Default: light, with subtle gray surfaces
- Optional: dark mode

### 11.2 Typography
- Sans-serif (system)
- Comfortable line height

### 11.3 Spacing
- 8px grid
- Generous padding

### 11.4 Components
- Rounded corners (12–16px)
- Soft shadows (very subtle)
- Hover-only affordances

---

## 12. Keyboard Shortcuts (MVP)
- ⌘/Ctrl + K: command palette (Phase 2) — in v1, opens project switcher
- ⌘/Ctrl + Enter: send chat
- ⌘/Ctrl + Shift + Enter: send to Codex
- Esc: close modals

---

## 13. Accessibility
- Full keyboard navigation
- Focus rings
- ARIA labels
- High contrast mode compatible

---

## 14. Implementation Notes (for Codex)
- Use a single layout component with split panes.
- Keep UI state thin; source of truth is Main process.
- Only show secondary actions on hover.
- Ensure fast cold-start; defer heavy work.

---

## 15. Acceptance Criteria (UI/UX)
- The app’s default view is calm and uncluttered.
- New users can: open project → attach file → apply patch → send to Codex in < 60 seconds.
- Canvas and Terminal never fight for attention.
- The interaction model mirrors ChatGPT: messages + attachments + simple composer.

---

## 16. Pixel-Level Layout Spec (Implementation-Ready)

### 16.1 App Window
- **Default window size:** 1200×800
- **Minimum window size:** 980×720
- **Maximize:** supported

### 16.2 Pane Sizes (Default)
- **Sidebar:** 280px (min 220 / max 360)
- **Chat (center):** flex remainder (min 420)
- **Canvas:** 360px (min 320 / max 480)
- **Terminal drawer height (expanded):** 280px (min 200 / max 420)

### 16.3 Spacing & Radius Tokens
- **Spacing scale:** 4 / 8 / 12 / 16 / 24
- **Card padding:** 12px
- **Composer padding:** 12px
- **Corner radius:**
  - chips: 999px
  - cards: 14px
  - modals: 18px
- **Border:** 1px, subtle neutral

### 16.4 Typography
- **Base font:** system UI
- **Sizes:**
  - body: 14px
  - small/meta: 12px
  - headers: 16px
  - top bar title: 13px
- **Line height:** 1.45

### 16.5 Color System
- **Background:** neutral-50 (light) / neutral-950 (dark)
- **Surface:** neutral-0 / neutral-900
- **Surface-alt:** neutral-100 / neutral-850
- **Text:** neutral-900 / neutral-100
- **Muted text:** neutral-600 / neutral-400
- **Border:** neutral-200 / neutral-800
- **Primary:** accent (blue/indigo) used sparingly
- **Status:**
  - idle: neutral
  - running: blue
  - attention: amber
  - error: red

---

## 17. Component Specifications

### 17.1 Top Bar
- Height: **44px**
- Left group:
  - **Project selector:** "Project Name ▾" (button)
  - **Path hint:** muted text
  - **Branch pill (if available):** "main" (chip)
- Right group:
  - **Status pill:**
    - "● Idle" / "● Running" / "● Needs attention"
  - **Overflow:** "⋯" icon button

### 17.2 Sidebar
- Uses accordion sections with titles:
  - **Canvases**
  - **Runs**
  - **Files**
- Section header height: 36px
- List row height: 34px
- Selected row: subtle surface highlight

### 17.3 Chat Messages
- Max message width: 720px
- Bubble padding: 10px 12px
- Bubble radius: 14px
- User bubble: primary-tinted surface
- Assistant bubble: surface
- Code blocks:
  - monospace 13px
  - copy button (top-right)
  - wrap toggle (optional)

### 17.4 Composer
- Sticky bottom bar
- Height (single line): 56px
- Text area:
  - min 1 line, max 8 lines
  - Enter = newline, Ctrl/⌘+Enter = Send
- Left icons:
  - **Paperclip** (Attach)
  - **Globe** (Web toggle) — only shown if web is enabled
- Right button:
  - **Send** (primary)
- Attachment chips row appears above composer when present

### 17.5 Attachment Chips
- Chip height: 28px
- Contents: icon + filename + size
- Right side: mode dropdown (Reference/Snapshot) + remove (×)
- Tooltip on hover shows full path

### 17.6 Canvas Panel
- Header row:
  - Title: "Canvas"
  - Secondary: "Rev N" (muted)
  - Buttons: "Preview" (ghost) and "Send to Codex" (primary)
- Section cards (collapsible):
  - Header: 36px
  - Body padding: 12px
  - Edit affordance appears on hover

### 17.7 Patch Diff Drawer
- Appears at top of Canvas panel when PatchOps exist
- Shows grouped changes:
  - Section name
  - before/after snippet
- Buttons:
  - **Apply** (primary)
  - **Reject** (ghost)
  - **Edit** (secondary)

### 17.8 Terminal Drawer
- Collapsed height: 36px
- Expanded default: 280px
- Header contains:
  - Label: "Terminal"
  - Controls: Stop, Clear, Re-run
  - Chevron toggle
- Content: xterm full width/height

### 17.9 Modals
- Modal width:
  - preview prompt: 840px (max 90vw)
  - run details: 920px
- Modal actions:
  - Close (x)
  - Secondary actions at bottom-right

---

## 18. Iconography & Labels (Exact)

### 18.1 Icons
- Attach: paperclip
- Web toggle: globe
- Overflow: ellipsis
- Pin: pin
- Copy: copy
- Apply to Canvas: arrow-down-into-line (or similar)
- Preview: eye
- Send to Codex: play/rocket (use text label primarily)
- Terminal: terminal icon
- Stop: square
- Re-run: rotate-cw

### 18.2 Button Labels (Exact)
- **Chat composer:** "Send"
- **Canvas primary:** "Send to Codex"
- **Canvas secondary:** "Preview"
- **Patch drawer:** "Apply", "Reject", "Edit"
- **Run details:** "Open transcript", "Open prompt"
- **Project empty:** "Open Folder"

---

## 19. UI State Machines (Implementation Guidance)

### 19.1 Project State
- **NoProject** → OpenFolder → **ProjectReady**
- **ProjectReady** → (init) → **ProjectReady**
- **ProjectReady** → error → **NeedsAttention**

### 19.2 Chat State
- **Idle**
- **Sending** (disable Send)
- **Receiving** (stream assistant)
- **PatchPending** (PatchOps exist)

Rules:
- If PatchPending, show patch drawer; allow continued chat.

### 19.3 Canvas State
- **Synced** (no local edits)
- **Drafting** (renderer draft differs)
- **Saving**
- **PatchPreview**

Rules:
- Saving commits a new Canvas revision snapshot.

### 19.4 Run State
- **Ready**
- **Compiling**
- **Running** (terminal auto-opens)
- **FinishedSuccess**
- **FinishedError**

Rules:
- Terminal drawer auto-opens on Running.
- Run card appears in chat after Finished.

---

## 20. Interaction Details (No Surprises)

### 20.1 Send to Codex (Exact Sequence)
1. Validate required Canvas fields (Task not empty)
2. Snapshot revision (`send_to_codex`)
3. Compile
4. Start run record
5. Launch Codex via PTY
6. Stream output to terminal + transcript
7. Finalize run record
8. Show run summary card + links
9. Branch working Canvas (increment revision) for continued editing

### 20.2 Apply PatchOps
- Clicking "Apply" applies ops in order
- If an op fails validation:
  - stop applying
  - show error inline
  - allow edit of ops

### 20.3 Attachments
- Dropping a file instantly creates a chip
- Default mode computed; user can override
- Prompt "Add to Canvas context?" default ON
- Removing from chat does not delete stored snapshots unless user explicitly chooses “Delete from assets”

---

## 21. Performance Requirements
- App cold start to interactive: **< 2.5s** on modern Mac
- Terminal output must stream smoothly (no UI hitching)
- Large repos: never auto-index everything; only include selected context

---

## 22. Deliverables for Implementation
Codex must implement:
- Layout with resizable split panes
- All components above with exact labels
- State machines and transitions
- Hover-only secondary actions
- Responsive collapse behavior

---

**End of UI/UX Specification (Locked)**
