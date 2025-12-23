export interface RunHandle {
  id: string;
}

export class CodexRunner {
  // TODO: manage PTY sessions and Codex CLI execution.
  startSession(projectRoot: string): string {
    void projectRoot;
    return "session_stub";
  }

  runCodex(sessionId: string, commandSpec: string, prompt: string): RunHandle {
    void sessionId;
    void commandSpec;
    void prompt;
    return { id: "run_stub" };
  }

  interrupt(runHandle: RunHandle): void {
    void runHandle;
  }

  disposeSession(sessionId: string): void {
    void sessionId;
  }
}
