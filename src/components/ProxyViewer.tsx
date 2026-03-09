import { type JSX, useCallback, useState } from "react";
import type { CapturedLog } from "../proxy/schemas";
import { LogEntry } from "./proxy-viewer/LogEntry";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

function truncateSessionId(id: string): string {
  if (id.length <= 30) return id;
  return id.slice(0, 12) + "…" + id.slice(-12);
}

function computeTokenSummary(logs: CapturedLog[]): { totalIn: number; totalOut: number } {
  let totalIn = 0;
  let totalOut = 0;
  for (const log of logs) {
    if (log.inputTokens !== null) totalIn += log.inputTokens;
    if (log.outputTokens !== null) totalOut += log.outputTokens;
  }
  return { totalIn, totalOut };
}

function CopyableCommand({ command }: { command: string }): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void window.navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [command]);

  return (
    <div className="inline-flex items-center gap-2 bg-muted rounded-md px-3 py-2">
      <pre className="text-blue-500 font-mono text-sm m-0">{command}</pre>
      <button
        type="button"
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
        aria-label="Copy command"
      >
        {copied ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        )}
      </button>
    </div>
  );
}

export type ProxyViewerProps = {
  logs: CapturedLog[];
  sessions: string[];
  models: string[];
  selectedSession: string;
  selectedModel: string;
  onSessionChange: (session: string) => void;
  onModelChange: (model: string) => void;
};

export function ProxyViewer({
  logs,
  sessions,
  models,
  selectedSession,
  selectedModel,
  onSessionChange,
  onModelChange,
}: ProxyViewerProps): JSX.Element {
  const { totalIn, totalOut } = computeTokenSummary(logs);

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-lg font-bold flex-1">Claude Code Proxy</h1>
        <span className="text-muted-foreground text-xs font-mono">
          {logs.length} request{logs.length !== 1 ? "s" : ""}
          {totalIn > 0 || totalOut > 0
            ? ` · ${totalIn.toLocaleString()} in / ${totalOut.toLocaleString()} out`
            : ""}
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={selectedSession} onValueChange={onSessionChange}>
          <SelectTrigger className="flex-1 max-w-[400px] text-xs">
            <SelectValue placeholder="All sessions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All sessions</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s} value={s}>
                {truncateSessionId(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="All models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All models</SelectItem>
            {models.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Log list */}
      <div>
        {logs.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 space-y-4">
            <p className="text-sm">No requests captured yet.</p>
            <p className="text-xs">Configure Claude Code with:</p>
            <CopyableCommand command="ANTHROPIC_BASE_URL=http://localhost:25947/proxy claude" />
          </div>
        ) : (
          logs.map((log) => <LogEntry key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}
