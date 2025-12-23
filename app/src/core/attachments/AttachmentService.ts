export interface AttachmentInput {
  path: string;
  type: "file" | "image" | "text";
}

export interface AttachmentRecord {
  id: string;
  mode: "reference" | "snapshot";
  relativePath: string;
}

export class AttachmentService {
  // TODO: ingest attachments and manage snapshot storage.
  addAttachment(input: AttachmentInput): AttachmentRecord {
    void input;
    return { id: "att_stub", mode: "reference", relativePath: "" };
  }

  resolvePath(attachment: AttachmentRecord): string {
    return attachment.relativePath;
  }

  getThumbnail(attachmentId: string): string {
    void attachmentId;
    return "";
  }
}
