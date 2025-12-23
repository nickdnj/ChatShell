import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("codex", {
  sendToCodex: (prompt: string) => ipcRenderer.invoke("codex:send", { prompt }),
  sendCodexInput: (runId: string, answer: string) =>
    ipcRenderer.invoke("codex:answer", { runId, answer }),
  onCodexEvent: (handler: (event: unknown) => void) => {
    const listener = (_event: unknown, data: unknown) => handler(data);
    ipcRenderer.on("codex:event", listener);
    return () => ipcRenderer.removeListener("codex:event", listener);
  },
  sendChat: (message: string, proposeToCanvas: boolean, runId?: string) =>
    ipcRenderer.invoke("chat:send", { message, proposeToCanvas, runId }),
  onChatEvent: (handler: (event: unknown) => void) => {
    const listener = (_event: unknown, data: unknown) => handler(data);
    ipcRenderer.on("chat:event", listener);
    return () => ipcRenderer.removeListener("chat:event", listener);
  },
  onAppEvent: (handler: (event: unknown) => void) => {
    const listener = (_event: unknown, data: unknown) => handler(data);
    ipcRenderer.on("app:menu", listener);
    return () => ipcRenderer.removeListener("app:menu", listener);
  },
  getApiKey: () => ipcRenderer.invoke("system:getApiKey"),
  setApiKey: (value: string) => ipcRenderer.invoke("system:setApiKey", { value })
});
