export interface RunContext {
  id: string;
}

export interface RunMeta {
  projectRoot: string;
  canvasRevisionId: string;
  compiledPromptHash: string;
}

export class RunLogger {
  // TODO: persist run metadata and transcripts.
  startRun(meta: RunMeta): RunContext {
    void meta;
    return { id: "run_stub" };
  }

  appendTranscript(runId: string, chunk: string): void {
    void runId;
    void chunk;
  }

  finalizeRun(runId: string, exitCode: number): void {
    void runId;
    void exitCode;
  }
}
