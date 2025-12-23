export type CodexEvent =
  | { type: "run_started"; runId: string }
  | { type: "log"; runId: string; line: string }
  | { type: "question"; runId: string; prompt: string }
  | { type: "run_finished"; runId: string; exitCode: number };

export type ChatEvent =
  | { type: "delta"; runId: string; delta: string }
  | { type: "done"; runId: string }
  | { type: "error"; runId: string; message: string };

export interface CodexApi {
  sendToCodex: (prompt: string) => Promise<{ runId: string }>;
  sendCodexInput: (runId: string, answer: string) => Promise<{ ok: boolean }>;
  onCodexEvent: (handler: (event: CodexEvent) => void) => () => void;
  sendChat: (message: string, proposeToCanvas: boolean, runId?: string) => Promise<{ runId: string }>;
  onChatEvent: (handler: (event: ChatEvent) => void) => () => void;
  onAppEvent: (handler: (event: { action: string }) => void) => () => void;
  getApiKey: () => Promise<{ value: string }>;
  setApiKey: (value: string) => Promise<{ ok: boolean }>;
}

declare global {
  interface Window {
    codex: CodexApi;
  }
}
