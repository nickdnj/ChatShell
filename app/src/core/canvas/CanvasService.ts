export interface Canvas {
  schema_version: number;
}

export interface SaveResult {
  updatedAt: string;
}

export interface RevisionRef {
  id: string;
  savedAt: string;
}

export interface PatchOp {
  op: string;
  path: string;
  value?: unknown;
}

export interface PatchResult {
  nextCanvas: Canvas;
  diff: string;
}

export class CanvasService {
  // TODO: load, validate, and persist the current canvas.
  loadCurrent(): Canvas {
    return { schema_version: 1 };
  }

  saveCurrent(canvas: Canvas, reason: string): SaveResult {
    void reason;
    return { updatedAt: new Date().toISOString() };
  }

  snapshotRevision(canvas: Canvas, reason: string): RevisionRef {
    void canvas;
    void reason;
    return { id: "rev_stub", savedAt: new Date().toISOString() };
  }

  applyOps(canvas: Canvas, ops: PatchOp[]): PatchResult {
    void ops;
    return { nextCanvas: canvas, diff: "" };
  }
}
