import { BrowserWindow, ipcMain, IpcMainInvokeEvent } from "electron";
import { spawn } from "node:child_process";
import keytar from "keytar";

type IpcHandler = (event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown> | unknown;

type CodexEvent =
  | { type: "run_started"; runId: string }
  | { type: "log"; runId: string; line: string }
  | { type: "question"; runId: string; prompt: string }
  | { type: "run_finished"; runId: string; exitCode: number };

type ChatEvent =
  | { type: "delta"; runId: string; delta: string }
  | { type: "done"; runId: string }
  | { type: "error"; runId: string; message: string };

const activeRuns = new Map<string, { window: BrowserWindow; awaitingInput: boolean; process?: ReturnType<typeof spawn> }>();

const sendEvent = (window: BrowserWindow, event: CodexEvent) => {
  window.webContents.send("codex:event", event);
};

const sendChatEvent = (window: BrowserWindow, event: ChatEvent) => {
  window.webContents.send("chat:event", event);
};

const extractChatDelta = (payload: any): string | null => {
  if (!payload || typeof payload !== "object") return null;
  if (payload.type === "response.output_text.delta" && typeof payload.delta === "string") {
    return payload.delta;
  }
  if (payload.type === "response.output_text" && typeof payload.text === "string") {
    return payload.text;
  }
  return null;
};

const streamOpenAIResponse = async (
  window: BrowserWindow,
  apiKey: string,
  runId: string,
  message: string,
  proposeToCanvas: boolean
) => {
  const instructions = proposeToCanvas
    ? "You are assisting with Codex Canvas Workbench. Provide helpful research and ALWAYS include a JSON array of PatchOps in a fenced ```json``` block. Allowed paths (no leading slash): system, intent, task, constraints, style, deliverables, attachments, context, webSources. Ops: set, append, add_attachment (for attachments), add_context_file (for webSources). For task content, use a single string value (no nested objects)."
    : "You are assisting with Codex Canvas Workbench. Provide helpful research and guidance. Do not output PatchOps unless explicitly requested.";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      stream: true,
      instructions,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: message
            }
          ]
        }
      ]
    })
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    sendChatEvent(window, {
      type: "error",
      runId,
      message: `OpenAI error: ${response.status} ${errorText}`
    });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.replace(/^data:\s*/, "");
      if (data === "[DONE]") {
        sendChatEvent(window, { type: "done", runId });
        return;
      }
      try {
        const payload = JSON.parse(data);
        const delta = extractChatDelta(payload);
        if (delta) {
          sendChatEvent(window, { type: "delta", runId, delta });
        }
      } catch {
        // Ignore malformed streaming chunks.
      }
    }
  }

  sendChatEvent(window, { type: "done", runId });
};

export const registerIpcHandlers = (window: BrowserWindow) => {
  const serviceName = "CodexCanvasWorkbench";
  const handlers: Record<string, IpcHandler> = {
    "chat:send": async (_event, ...args) => {
      const payload = args[0] as { message?: string; proposeToCanvas?: boolean; runId?: string } | undefined;
      const message = payload?.message ?? "";
      const proposeToCanvas = payload?.proposeToCanvas ?? false;
      const apiKey = await keytar.getPassword(serviceName, "openai_api_key");
      const runId = payload?.runId ?? `chat_${Date.now()}`;

      if (!apiKey) {
        sendChatEvent(window, { type: "error", runId, message: "Missing OpenAI API key." });
        return { runId };
      }

      streamOpenAIResponse(window, apiKey, runId, message, proposeToCanvas).catch((error) => {
        sendChatEvent(window, {
          type: "error",
          runId,
          message: `Streaming failed: ${String(error)}`
        });
      });

      return { runId };
    },
    "system:getApiKey": async () => {
      const value = await keytar.getPassword(serviceName, "openai_api_key");
      return { value: value ?? "" };
    },
    "system:setApiKey": async (_event, ...args) => {
      const payload = args[0] as { value?: string } | undefined;
      const value = payload?.value ?? "";
      if (!value) {
        await keytar.deletePassword(serviceName, "openai_api_key");
        return { ok: true };
      }
      await keytar.setPassword(serviceName, "openai_api_key", value);
      return { ok: true };
    },
    "codex:send": async (_event, ...args) => {
      const payload = args[0] as { prompt?: string } | undefined;
      const prompt = payload?.prompt ?? "";
      const runId = `run_${Date.now()}`;
      sendEvent(window, { type: "run_started", runId });
      sendEvent(window, { type: "log", runId, line: "Starting Codex CLI..." });
      sendEvent(window, { type: "log", runId, line: `Prompt length: ${prompt.length} chars` });

      const child = spawn("codex", ["exec"], {
        cwd: process.cwd(),
        env: process.env
      });

      activeRuns.set(runId, { window, awaitingInput: false, process: child });

      child.stdout.on("data", (data: Buffer) => {
        sendEvent(window, { type: "log", runId, line: data.toString() });
      });

      child.stderr.on("data", (data: Buffer) => {
        sendEvent(window, { type: "log", runId, line: data.toString() });
      });

      child.on("close", (code) => {
        sendEvent(window, { type: "run_finished", runId, exitCode: code ?? 0 });
        activeRuns.delete(runId);
      });

      child.stdin.write(prompt);
      child.stdin.end();

      return { runId };
    },
    "codex:answer": async (_event, ...args) => {
      const payload = args[0] as { runId?: string; answer?: string } | undefined;
      const runId = payload?.runId ?? "";
      const answer = payload?.answer ?? "";
      const run = activeRuns.get(runId);
      if (!run) return { ok: false };
      run.awaitingInput = false;
      sendEvent(run.window, { type: "log", runId, line: `User input: ${answer}` });
      sendEvent(run.window, { type: "log", runId, line: "Codex continues..." });
      setTimeout(() => {
        sendEvent(run.window, { type: "run_finished", runId, exitCode: 0 });
        activeRuns.delete(runId);
      }, 600);
      return { ok: true };
    }
  };

  Object.entries(handlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler);
  });
};
