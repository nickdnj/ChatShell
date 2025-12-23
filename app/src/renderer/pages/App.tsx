import React, { useEffect, useMemo, useRef, useState } from "react";

type CanvasState = {
  system: string;
  intent: string;
  task: string;
  constraints: string;
  style: string;
  deliverables: string;
  context: string;
  attachments: string[];
  webSources: string[];
};

type PatchOp = {
  op: "set" | "append" | "add_attachment" | "add_context_file";
  path: keyof CanvasState;
  value: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export const App = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [codexInput, setCodexInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyStatus, setApiKeyStatus] = useState<"idle" | "saved">("idle");
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "Terminal ready. Send to Codex to start a run."
  ]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [pendingOps, setPendingOps] = useState<PatchOp[] | null>(null);
  const [proposeToCanvas, setProposeToCanvas] = useState(false);
  const [showCanvas, setShowCanvas] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [chatRunId, setChatRunId] = useState<string | null>(null);
  const [chatStreaming, setChatStreaming] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"prompt" | "guardrails" | "credentials">("prompt");
  const [newAttachment, setNewAttachment] = useState("");
  const [newWebSource, setNewWebSource] = useState("");
  const [canvas, setCanvas] = useState<CanvasState>({
    system: "You are a helpful assistant.",
    intent: "Summarize the objective and desired outcome.",
    task: "",
    constraints: "Follow repository guidelines and locked specs.",
    style: "Concise, calm, precise.",
    deliverables: "Provide code changes and brief explanation.",
    context: "Project files will be listed here.",
    attachments: [],
    webSources: []
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "seed-user",
      role: "user",
      text: "Set up the skeleton for the renderer and main process."
    },
    {
      id: "seed-assistant-1",
      role: "assistant",
      text: "Proposed PatchOps: add layout scaffolding, initialize IPC router, and wire preload."
    },
    {
      id: "seed-assistant-2",
      role: "assistant",
      text: "Preview ready. Apply changes?"
    }
  ]);
  const messagesRef = useRef(messages);
  const pendingOpsRef = useRef(pendingOps);
  const canvasRef = useRef(canvas);
  const chatPromptRef = useRef<Record<string, string>>({});
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    pendingOpsRef.current = pendingOps;
  }, [pendingOps]);
  useEffect(() => {
    canvasRef.current = canvas;
  }, [canvas]);

  const canAnswer = codexInput.trim().length > 0 && !!activeRunId;
  const hasPendingOps = pendingOps && pendingOps.length > 0;

  useEffect(() => {
    if (!window.codex) return;
    const unsubscribe = window.codex.onCodexEvent((event) => {
      if (event.type === "run_started") {
        setIsRunning(true);
        setActiveRunId(event.runId);
        setTerminalLines((prev) => [...prev, `Run ${event.runId} started.`]);
      }
      if (event.type === "log") {
        setTerminalLines((prev) => [...prev, event.line]);
      }
      if (event.type === "question") {
        setPendingQuestion(event.prompt);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant_${Date.now()}`,
            role: "assistant",
            text: `Codex asks: ${event.prompt}`
          }
        ]);
      }
      if (event.type === "run_finished") {
        setIsRunning(false);
        setPendingQuestion(null);
        setActiveRunId(null);
        setTerminalLines((prev) => [
          ...prev,
          `Run finished with exit code ${event.exitCode}.`
        ]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!window.codex) return;
    const unsubscribe = window.codex.onChatEvent((event) => {
      const ensureAssistantMessage = (seedText = "") => {
        setMessages((prev) => {
          if (prev.some((message) => message.id === event.runId)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: event.runId,
              role: "assistant",
              text: seedText
            }
          ];
        });
      };

      if (event.type === "delta") {
        ensureAssistantMessage();
        setMessages((prev) =>
          prev.map((message) =>
            message.id === event.runId
              ? { ...message, text: message.text + event.delta }
              : message
          )
        );
      }
      if (event.type === "error") {
        setChatStreaming(false);
        ensureAssistantMessage();
        setMessages((prev) =>
          prev.map((message) =>
            message.id === event.runId
              ? { ...message, text: message.text + `\n\n[Error] ${event.message}` }
              : message
          )
        );
      }
      if (event.type === "done") {
        setChatStreaming(false);
        const assistant = messagesRef.current.find((message) => message.id === event.runId);
        if (assistant) {
          const urlOps = extractUrls(assistant.text).map((url) => ({
            op: "add_context_file" as const,
            path: "webSources" as const,
            value: url
          }));
          const mergedUrlOps = urlOps.filter(
            (op) => !canvasRef.current.webSources.includes(op.value)
          );
          if (mergedUrlOps.length > 0) {
            setPendingOps(mergeOps(pendingOpsRef.current, mergedUrlOps));
          }
        }
        if (proposeToCanvas && event.runId === chatRunId) {
          const ops = assistant ? parsePatchOps(assistant.text) : null;
          if (ops && ops.length > 0) {
            const taskOnly = ops.every(
              (op) => op.path === "task" && (op.op === "set" || op.op === "append")
            );
            if (taskOnly) {
              applyOps(ops);
              setPendingOps(null);
              setMessages((prev) => [
                ...prev,
                {
                  id: `assistant_${Date.now()}`,
                  role: "assistant",
                  text: "Task updated from chat."
                }
              ]);
            } else {
              setPendingOps(mergeOps(pendingOpsRef.current, ops));
            }
          } else {
            const fallbackPrompt = chatPromptRef.current[event.runId];
            if (fallbackPrompt) {
              const fallbackOp: PatchOp = {
                op: canvasRef.current.task ? "append" : "set",
                path: "task",
                value: fallbackPrompt
              };
              applyOps([fallbackOp]);
              setPendingOps(null);
              setMessages((prev) => [
                ...prev,
                {
                  id: `assistant_${Date.now()}`,
                  role: "assistant",
                  text: "No PatchOps detected. Task updated from your message."
                }
              ]);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [chatRunId, proposeToCanvas]);

  useEffect(() => {
    if (!window.codex) return;
    const unsubscribe = window.codex.onAppEvent((event) => {
      if (event.action === "open-settings") {
        setSettingsOpen(true);
      }
      if (event.action === "open-project") {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant_${Date.now()}`,
            role: "assistant",
            text: "Open Project is not wired yet."
          }
        ]);
      }
      if (event.action === "toggle-canvas") {
        setShowCanvas((prev) => !prev);
      }
      if (event.action === "toggle-terminal") {
        setShowTerminal((prev) => !prev);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!settingsOpen || !window.codex) return;
    window.codex.getApiKey().then((response) => {
      setApiKey(response.value);
      setApiKeyStatus("idle");
    });
  }, [settingsOpen]);

  const handleSaveApiKey = async () => {
    if (!window.codex) return;
    await window.codex.setApiKey(apiKey);
    setApiKeyStatus("saved");
    setTimeout(() => setApiKeyStatus("idle"), 2000);
  };

  const handleCanvasChange = (field: keyof CanvasState, value: string) => {
    setCanvas((prev) => ({ ...prev, [field]: value }));
  };

  const applyOps = (ops: PatchOp[]) => {
    setCanvas((prev) => {
      const next = { ...prev };
      ops.forEach((op) => {
        if (op.op === "set") {
          next[op.path] = op.value;
        } else if (op.op === "append") {
          if (typeof next[op.path] === "string") {
            next[op.path] = `${next[op.path]}\n${op.value}`.trim();
          }
        } else if (op.op === "add_attachment") {
          if (op.path === "attachments") {
            if (!next.attachments.includes(op.value)) {
              next.attachments = [...next.attachments, op.value];
            }
          }
        } else if (op.op === "add_context_file") {
          if (op.path === "webSources") {
            if (!next.webSources.includes(op.value)) {
              next.webSources = [...next.webSources, op.value];
            }
          }
        }
      });
      return next;
    });
  };

  const parsePatchOps = (text: string): PatchOp[] | null => {
    const allowedPaths: Array<keyof CanvasState> = [
      "system",
      "intent",
      "task",
      "constraints",
      "style",
      "deliverables",
      "context",
      "attachments",
      "webSources"
    ];
    const normalizePath = (path: string): keyof CanvasState | null => {
      const cleaned = path.replace(/^\//, "");
      return allowedPaths.includes(cleaned as keyof CanvasState)
        ? (cleaned as keyof CanvasState)
        : null;
    };
    const normalizeValue = (value: unknown): string | null => {
      if (typeof value === "string") return value;
      if (value === null || value === undefined) return null;
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return null;
      }
    };
    const fenced = text.match(/```json\s*([\s\S]*?)```/);
    const raw = fenced ? fenced[1] : null;
    const candidate = raw ?? text.match(/\[[\s\S]*\]/)?.[0];
    if (!candidate) return null;
    try {
      const parsed = JSON.parse(candidate);
      if (!Array.isArray(parsed)) return null;
      return parsed
        .map((op: { op?: string; path?: string; value?: unknown }) => {
          if (!op || typeof op.op !== "string" || typeof op.path !== "string") return null;
          const normalizedPath = normalizePath(op.path);
          if (!normalizedPath) return null;
          if (!["set", "append", "add_attachment", "add_context_file"].includes(op.op)) return null;
          const normalizedValue = normalizeValue(op.value);
          if (!normalizedValue) return null;
          return {
            op: op.op as PatchOp["op"],
            path: normalizedPath,
            value: normalizedValue
          };
        })
        .filter((op): op is PatchOp => !!op);
    } catch {
      return null;
    }
  };

  const compilePrompt = () => {
    const sections = [
      ["SYSTEM", canvas.system],
      ["INTENT", canvas.intent],
      ["TASK", canvas.task],
      ["CONSTRAINTS", canvas.constraints],
      ["STYLE", canvas.style],
      ["DELIVERABLES", canvas.deliverables],
      ["ATTACHMENTS", canvas.attachments.join("\n")],
      ["WEB SOURCES", canvas.webSources.join("\n")],
      ["CONTEXT", canvas.context]
    ];

    return sections
      .filter(([, value]) => value && value.trim().length > 0)
      .map(([title, value]) => `[${title}]\n${value}`.trim())
      .join("\n\n");
  };

  const extractUrls = (text: string): string[] => {
    const matches = text.match(/https?:\/\/[^\s)]+/g);
    return matches ? Array.from(new Set(matches)) : [];
  };

  const mergeOps = (base: PatchOp[] | null, extra: PatchOp[]): PatchOp[] => {
    const merged = [...(base ?? [])];
    extra.forEach((op) => {
      if (!merged.some((existing) => existing.op === op.op && existing.path === op.path && existing.value === op.value)) {
        merged.push(op);
      }
    });
    return merged;
  };

  const handleApplyOps = () => {
    if (!pendingOps) return;
    applyOps(pendingOps);
    setPendingOps(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        text: "Applied PatchOps to the Canvas."
      }
    ]);
  };

  const handleRejectOps = () => {
    setPendingOps(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        text: "PatchOps rejected."
      }
    ]);
  };

  const handleSend = async () => {
    const prompt = compilePrompt();
    if (!prompt || !window.codex) return;
    if (!canvas.task.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          text: "Add a Task before sending to Codex."
        }
      ]);
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        text: "Sending current Task to Codex..."
      }
    ]);
    setPendingQuestion(null);
    setTerminalLines((prev) => [...prev, "Preparing run..."]);
    await window.codex.sendToCodex(prompt);
  };

  const handleAnswer = async () => {
    if (!activeRunId || !window.codex) return;
    const answer = codexInput.trim();
    if (!answer) return;
    setMessages((prev) => [
      ...prev,
      { id: `user_${Date.now()}`, role: "user", text: `Answer to Codex: ${answer}` }
    ]);
    setCodexInput("");
    setPendingQuestion(null);
    await window.codex.sendCodexInput(activeRunId, answer);
  };

  const handleChatSend = async () => {
    const prompt = draft.trim();
    if (!prompt || !window.codex) return;
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      text: prompt
    };
    const runId = `chat_${Date.now()}`;
    setDraft("");
    const urlOps = extractUrls(prompt).map((url) => ({
      op: "add_context_file" as const,
      path: "webSources" as const,
      value: url
    }));
    if (urlOps.length > 0) {
      setPendingOps(urlOps);
    } else {
      setPendingOps(null);
    }
    setChatStreaming(true);
    try {
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: runId, role: "assistant", text: "" }
      ]);
      chatPromptRef.current[runId] = prompt;
      const response = await window.codex.sendChat(prompt, proposeToCanvas, runId);
      setChatRunId(response.runId);
    } catch (error) {
      setChatStreaming(false);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === runId
            ? {
                ...message,
                text: `Chat failed: ${String(error)}`
              }
            : message
        )
      );
    }
  };

  const canvasSections = useMemo(
    () => [{ key: "task", title: "Task", value: canvas.task }],
    [canvas]
  );

  const handleAddAttachment = () => {
    const value = newAttachment.trim();
    if (!value) return;
    setCanvas((prev) =>
      prev.attachments.includes(value)
        ? prev
        : { ...prev, attachments: [...prev.attachments, value] }
    );
    setNewAttachment("");
  };

  const handleAddWebSource = () => {
    const value = newWebSource.trim();
    if (!value) return;
    setCanvas((prev) =>
      prev.webSources.includes(value)
        ? prev
        : { ...prev, webSources: [...prev.webSources, value] }
    );
    setNewWebSource("");
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">Codex Canvas Workbench</div>
        <div className="top-actions">
          <button
            type="button"
            className="primary"
            onClick={handleSend}
            disabled={isRunning || !canvas.task.trim()}
          >
            Send to Codex
          </button>
        </div>
      </header>

      <div className="main-grid">
        <aside className="sidebar left">
          <div className="section-title">Project</div>
          <div className="section-item">/path/to/project</div>
          <div className="section-title">Files</div>
          <div className="section-item">src/</div>
          <div className="section-item">README.md</div>
          <div className="section-item">.codexcanvas/</div>
          <div className="section-title">History</div>
          <div className="section-item">Run 0142 • 2m ago</div>
          <div className="section-item">Run 0141 • 1h ago</div>
          <div className="section-title">Attachments</div>
          <div className="section-item">spec.md (reference)</div>
          <div className="section-item">diagram.png (snapshot)</div>
        </aside>

        <main className="chat-panel">
          <div className="chat-header">Conversation</div>
          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="meta">{message.role === "user" ? "You" : "Assistant"}</div>
                <div className="bubble">{message.text}</div>
              </div>
            ))}
          </div>
          <div className="composer">
            <input
              type="text"
              placeholder="Describe a change or ask a question..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="button"
              className="primary"
              onClick={handleChatSend}
              disabled={!draft.trim() || chatStreaming}
            >
              Send
            </button>
          </div>
          <div className="composer-options">
            <label className="toggle">
              <input
                type="checkbox"
                checked={proposeToCanvas}
                onChange={(event) => setProposeToCanvas(event.target.checked)}
              />
              <span>Propose to Canvas</span>
            </label>
          </div>
          {hasPendingOps ? (
            <div className="patch-drawer">
              <div className="patch-title">PatchOps Preview</div>
              <div className="patch-list">
                {pendingOps?.map((op, index) => (
                  <div key={`${op.path}-${index}`} className="patch-item">
                    <span className="patch-op">{op.op}</span>
                    <span className="patch-path">{op.path}</span>
                    <span className="patch-value">{op.value}</span>
                  </div>
                ))}
              </div>
              <div className="patch-actions">
                <button type="button" className="ghost" onClick={handleRejectOps}>
                  Reject
                </button>
                <button type="button" className="primary" onClick={handleApplyOps}>
                  Apply to Canvas
                </button>
              </div>
            </div>
          ) : null}
          {pendingQuestion ? (
            <div className="codex-question">
              <div className="codex-question-title">Codex Input Required</div>
              <div className="codex-question-text">{pendingQuestion}</div>
              <div className="codex-question-actions">
                <input
                  type="text"
                  placeholder="Answer Codex..."
                  value={codexInput}
                  onChange={(event) => setCodexInput(event.target.value)}
                />
                <button type="button" className="primary" onClick={handleAnswer} disabled={!canAnswer}>
                  Send Answer
                </button>
              </div>
            </div>
          ) : null}
        </main>

        {showCanvas ? (
          <aside className="sidebar right">
            <div className="section-title">Canvas</div>
            {canvasSections.map((section) => (
              <div key={section.key} className="canvas-card">
                <div className="card-title">{section.title}</div>
                <textarea
                  value={section.value}
                  onChange={(event) =>
                    handleCanvasChange(section.key as keyof CanvasState, event.target.value)
                  }
                  rows={3}
                />
              </div>
            ))}
            <div className="canvas-card">
              <div className="card-title">Context Attachments</div>
              {canvas.attachments.length ? (
                <ul className="context-list">
                  {canvas.attachments.map((item, index) => (
                    <li key={`att-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <div className="card-meta">None added yet.</div>
              )}
              <div className="context-input">
                <input
                  type="text"
                  placeholder="Add attachment path or label"
                  value={newAttachment}
                  onChange={(event) => setNewAttachment(event.target.value)}
                />
                <button type="button" className="ghost" onClick={handleAddAttachment}>
                  Add
                </button>
              </div>
            </div>
            <div className="canvas-card">
              <div className="card-title">Web Sources</div>
              {canvas.webSources.length ? (
                <ul className="context-list">
                  {canvas.webSources.map((item, index) => (
                    <li key={`web-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <div className="card-meta">None added yet.</div>
              )}
              <div className="context-input">
                <input
                  type="text"
                  placeholder="Paste URL to include in context"
                  value={newWebSource}
                  onChange={(event) => setNewWebSource(event.target.value)}
                />
                <button type="button" className="ghost" onClick={handleAddWebSource}>
                  Add
                </button>
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      {showTerminal ? (
        <footer className="terminal-drawer">
          <div className="drawer-title">
            Terminal • {isRunning ? "Running" : "Idle"}
          </div>
          <div className="terminal-output">
            {terminalLines.map((line, index) => (
              <div key={`${line}-${index}`} className="terminal-line">
                {line}
              </div>
            ))}
          </div>
        </footer>
      ) : null}

      {settingsOpen ? (
        <div className="settings-panel" role="dialog" aria-modal="true">
          <div className="settings-header">
            <div className="settings-title">System Settings</div>
            <button
              type="button"
              className="ghost"
              onClick={() => setSettingsOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="settings-body">
            <div className="settings-tabs">
              <button
                type="button"
                className={`settings-tab ${settingsTab === "prompt" ? "active" : ""}`}
                onClick={() => setSettingsTab("prompt")}
              >
                Prompt
              </button>
              <button
                type="button"
                className={`settings-tab ${settingsTab === "guardrails" ? "active" : ""}`}
                onClick={() => setSettingsTab("guardrails")}
              >
                Guardrails
              </button>
              <button
                type="button"
                className={`settings-tab ${settingsTab === "credentials" ? "active" : ""}`}
                onClick={() => setSettingsTab("credentials")}
              >
                Credentials
              </button>
            </div>
            <div className="settings-section">
              {settingsTab === "prompt" ? (
                <>
                  <div className="settings-section-title">Prompt Defaults</div>
                  <label className="settings-label" htmlFor="canvas-system">
                    System
                  </label>
                  <textarea
                    id="canvas-system"
                    className="settings-textarea"
                    rows={3}
                    value={canvas.system}
                    onChange={(event) => handleCanvasChange("system", event.target.value)}
                  />
                  <label className="settings-label" htmlFor="canvas-intent">
                    Intent
                  </label>
                  <textarea
                    id="canvas-intent"
                    className="settings-textarea"
                    rows={3}
                    value={canvas.intent}
                    onChange={(event) => handleCanvasChange("intent", event.target.value)}
                  />
                  <label className="settings-label" htmlFor="canvas-style">
                    Style
                  </label>
                  <textarea
                    id="canvas-style"
                    className="settings-textarea"
                    rows={3}
                    value={canvas.style}
                    onChange={(event) => handleCanvasChange("style", event.target.value)}
                  />
                  <label className="settings-label" htmlFor="canvas-deliverables">
                    Deliverables
                  </label>
                  <textarea
                    id="canvas-deliverables"
                    className="settings-textarea"
                    rows={3}
                    value={canvas.deliverables}
                    onChange={(event) => handleCanvasChange("deliverables", event.target.value)}
                  />
                </>
              ) : null}
              {settingsTab === "guardrails" ? (
                <>
                  <div className="settings-section-title">Guardrails</div>
                  <label className="settings-label" htmlFor="canvas-constraints">
                    Constraints
                  </label>
                  <textarea
                    id="canvas-constraints"
                    className="settings-textarea"
                    rows={3}
                    value={canvas.constraints}
                    onChange={(event) => handleCanvasChange("constraints", event.target.value)}
                  />
                  <label className="settings-label" htmlFor="canvas-context">
                    Context
                  </label>
                  <textarea
                    id="canvas-context"
                    className="settings-textarea"
                    rows={3}
                    value={canvas.context}
                    onChange={(event) => handleCanvasChange("context", event.target.value)}
                  />
                </>
              ) : null}
              {settingsTab === "credentials" ? (
                <>
                  <div className="settings-section-title">Credentials</div>
                  <label className="settings-label" htmlFor="openai-key">
                    OpenAI API Key
                  </label>
                  <input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    className="settings-input"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                  />
                  <div className="settings-help">
                    Stored in the OS keychain for this user.
                  </div>
                </>
              ) : null}
            </div>
          </div>
          <div className="settings-footer">
            <button
              type="button"
              className="ghost"
              onClick={() => setSettingsOpen(false)}
            >
              Cancel
            </button>
            <button type="button" className="primary" onClick={handleSaveApiKey}>
              {apiKeyStatus === "saved" ? "Saved" : "Save Settings"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
