import type { Canvas } from "../canvas/CanvasService";

export interface CompileResult {
  prompt: string;
  metadataPath: string;
}

export class CompilerService {
  // TODO: deterministically compile canvas into a prompt and metadata.
  compile(canvas: Canvas): CompileResult {
    void canvas;
    return { prompt: "", metadataPath: "" };
  }
}
