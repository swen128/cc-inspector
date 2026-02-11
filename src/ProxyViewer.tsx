import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import type { ClaudeRequest, ContentBlockType, MessageType } from "./proxy/schemas";

interface CapturedLog {
  id: number;
  timestamp: string;
  method: string;
  path: string;
  model: string | null;
  sessionId: string | null;
  parsedRequest: ClaudeRequest | null;
  rawRequestBody: string | null;
  responseStatus: number | null;
  responseText: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  elapsedMs: number | null;
  streaming: boolean;
}

function prettifyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function truncateSessionId(id: string): string {
  if (id.length <= 30) return id;
  return id.slice(0, 12) + "…" + id.slice(-12);
}

// ── Content block renderers ──────────────────────────────────────────────────

function Markdown({ text }: { text: string }) {
  return <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{text}</ReactMarkdown></div>;
}

function TextBlock({ text }: { text: string }) {
  const isSystemReminder = text.includes("<system-reminder>");
  if (isSystemReminder) {
    return (
      <div className="text-muted-foreground text-xs italic py-1 truncate">
        [system-reminder]
      </div>
    );
  }
  return <Markdown text={text} />;
}

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-l-2 border-purple-500/40 pl-3 my-1">
      <button
        className="text-purple-400 text-xs font-bold cursor-pointer hover:text-purple-300"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        💭 Thinking {open ? "▼" : "▶"}
      </button>
      {open && (
        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap max-h-[80vh] overflow-auto">
          {thinking}
        </pre>
      )}
    </div>
  );
}

function ToolUseBlock({ name, input }: { name: string; input: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-l-2 border-blue-500/40 pl-3 my-1">
      <button
        className="text-blue-400 text-xs font-bold cursor-pointer hover:text-blue-300"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        ⚙ {name} {open ? "▼" : "▶"}
      </button>
      {open && (
        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap max-h-[80vh] overflow-auto">
          {JSON.stringify(input, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ToolResultBlock({ content, isError }: { content: string | unknown[]; isError?: boolean }) {
  const [open, setOpen] = useState(false);
  const label = isError ? "✘ Tool Error" : "↩ Tool Result";
  const color = isError ? "text-red-400" : "text-green-400";
  const borderColor = isError ? "border-red-500/40" : "border-green-500/40";
  const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);

  return (
    <div className={`border-l-2 ${borderColor} pl-3 my-1`}>
      <button
        className={`${color} text-xs font-bold cursor-pointer hover:opacity-80`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        {label} {open ? "▼" : "▶"}
      </button>
      {open && (
        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap max-h-[80vh] overflow-auto">
          {text}
        </pre>
      )}
    </div>
  );
}

function ToolDefBlock({ tool }: { tool: { name: string; description?: string; input_schema?: unknown } }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        className="text-cyan-400 text-xs font-mono cursor-pointer hover:text-cyan-300"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        {tool.name} {open ? "▼" : "▶"}
      </button>
      {open && (
        <div className="ml-3 mt-1 space-y-1">
          {tool.description && (
            <div className="text-xs text-muted-foreground max-h-[40vh] overflow-auto">
              <Markdown text={tool.description} />
            </div>
          )}
          {tool.input_schema && (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-[40vh] overflow-auto">
              {JSON.stringify(tool.input_schema, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function ContentBlockRenderer({ block }: { block: ContentBlockType }) {
  switch (block.type) {
    case "text":
      return <TextBlock text={block.text} />;
    case "thinking":
      return <ThinkingBlock thinking={block.thinking} />;
    case "tool_use":
      return <ToolUseBlock name={block.name} input={block.input} />;
    case "tool_result":
      return <ToolResultBlock content={block.content} isError={block.is_error} />;
    case "image":
      return <div className="text-muted-foreground text-xs italic">[image]</div>;
    default:
      return <pre className="text-xs">{JSON.stringify(block, null, 2)}</pre>;
  }
}

function MessageRenderer({ msg, index }: { msg: MessageType; index: number }) {
  const isUser = msg.role === "user";
  const roleColor = isUser ? "text-green-400" : "text-orange-400";
  const roleLabel = isUser ? "USER" : "ASSISTANT";

  const blocks = Array.isArray(msg.content)
    ? msg.content
    : [{ type: "text" as const, text: msg.content }];

  return (
    <div className="py-2 border-b border-border/50 last:border-b-0">
      <div className={`text-xs font-bold ${roleColor} mb-1 font-mono`}>
        {roleLabel}
      </div>
      <div className="text-sm space-y-1">
        {blocks.map((block, i) => (
          <ContentBlockRenderer key={`${index}-${i}`} block={block as ContentBlockType} />
        ))}
      </div>
    </div>
  );
}

// ── Parsed request view ──────────────────────────────────────────────────────

function ParsedRequestView({ req }: { req: ClaudeRequest }) {
  const [showSystem, setShowSystem] = useState(false);
  const [showTools, setShowTools] = useState(false);

  return (
    <div className="space-y-2">
      {req.system && req.system.length > 0 && (
        <div className="border-l-2 border-yellow-500/40 pl-3">
          <button
            className="text-yellow-500 text-xs font-bold cursor-pointer hover:text-yellow-400"
            onClick={(e) => {
              e.stopPropagation();
              setShowSystem(!showSystem);
            }}
          >
            system ({req.system.length} block{req.system.length > 1 ? "s" : ""}) {showSystem ? "▼" : "▶"}
          </button>
          {showSystem && (
            <div className="mt-1 space-y-1">
              {req.system.map((s, i) => (
                <div key={i} className="text-xs max-h-[80vh] overflow-auto">
                  <Markdown text={s.text} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {req.tools && req.tools.length > 0 && (
        <div className="border-l-2 border-cyan-500/40 pl-3">
          <button
            className="text-cyan-500 text-xs font-bold cursor-pointer hover:text-cyan-400"
            onClick={(e) => {
              e.stopPropagation();
              setShowTools(!showTools);
            }}
          >
            tools ({req.tools.length}) {showTools ? "▼" : "▶"}
          </button>
          {showTools && (
            <div className="mt-1 text-xs text-muted-foreground space-y-1">
              {req.tools.map((t, i) => (
                <ToolDefBlock key={i} tool={t} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-0">
        {req.messages.map((msg, i) => (
          <MessageRenderer key={i} msg={msg} index={i} />
        ))}
      </div>
    </div>
  );
}

// ── Log entry ────────────────────────────────────────────────────────────────

function LogEntry({ log }: { log: CapturedLog }) {
  const [expanded, setExpanded] = useState(false);
  const [raw, setRaw] = useState(false);

  const statusColor =
    log.responseStatus && log.responseStatus < 300
      ? "text-green-500"
      : log.responseStatus && log.responseStatus < 400
        ? "text-yellow-500"
        : "text-red-500";

  const tokens = [
    log.inputTokens != null ? `in: ${log.inputTokens.toLocaleString()}` : null,
    log.outputTokens != null ? `out: ${log.outputTokens.toLocaleString()}` : null,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div
      className="border border-border rounded-lg mb-3 overflow-hidden hover:border-muted-foreground/40 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/50">
        <span className="text-blue-500 font-bold text-xs font-mono">#{log.id}</span>
        {log.model && <span className="text-purple-500 text-xs font-mono">{log.model}</span>}
        {log.responseStatus && (
          <span className={`${statusColor} font-bold font-mono`}>{log.responseStatus}</span>
        )}
        {log.elapsedMs != null && (
          <span className="text-muted-foreground text-xs font-mono">{log.elapsedMs}ms</span>
        )}
        {tokens && <span className="text-muted-foreground text-xs font-mono">[{tokens}]</span>}
        <span className="flex-1" />
        <span className="text-muted-foreground text-xs">{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded && (
        <div className="border-t border-border" onClick={(e) => e.stopPropagation()}>
          <div className="px-4 py-2 border-b border-border flex justify-end">
            <button
              className="text-xs text-muted-foreground hover:text-foreground font-mono cursor-pointer"
              onClick={() => setRaw(!raw)}
            >
              {raw ? "Pretty" : "Raw JSON"}
            </button>
          </div>

          {raw ? (
            <div className="px-4 py-3">
              <pre className="text-xs text-foreground max-h-[80vh] overflow-auto font-mono whitespace-pre-wrap break-words">
                {prettifyJson(log.rawRequestBody ?? "")}
              </pre>
              {log.responseText && (
                <>
                  <div className={`text-xs font-bold my-2 font-mono ${statusColor}`}>RESPONSE</div>
                  <pre className="text-xs text-foreground max-h-[80vh] overflow-auto font-mono whitespace-pre-wrap break-words">
                    {prettifyJson(log.responseText)}
                  </pre>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border">
                <div className="text-yellow-500 text-xs font-bold mb-2 font-mono">REQUEST</div>
                {log.parsedRequest ? (
                  <ParsedRequestView req={log.parsedRequest} />
                ) : (
                  <pre className="text-xs text-foreground max-h-[80vh] overflow-auto font-mono whitespace-pre-wrap break-words">
                    {log.rawRequestBody ?? ""}
                  </pre>
                )}
              </div>

              {log.responseText && (
                <div className="px-4 py-3">
                  <div className={`text-xs font-bold mb-2 font-mono ${statusColor}`}>RESPONSE</div>
                  <div className="text-sm max-h-[80vh] overflow-auto">
                    <Markdown text={log.responseText} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main viewer ──────────────────────────────────────────────────────────────

export function ProxyViewer() {
  const [logs, setLogs] = useState<CapturedLog[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedSession) params.set("sessionId", selectedSession);
    if (selectedModel) params.set("model", selectedModel);

    const [logsRes, sessionsRes, modelsRes] = await Promise.all([
      fetch(`/api/logs?${params}`),
      fetch("/api/sessions"),
      fetch("/api/models"),
    ]);

    setLogs(await logsRes.json());
    setSessions(await sessionsRes.json());
    setModels(await modelsRes.json());
  }, [selectedSession, selectedModel]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-lg font-bold flex-1">Claude Code Proxy</h1>
        <span className="text-muted-foreground text-xs">
          {logs.length} request{logs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="bg-muted border border-border rounded-md px-3 py-2 text-xs text-foreground flex-1 max-w-[400px]"
        >
          <option value="">All sessions</option>
          {sessions.map((s) => (
            <option key={s} value={s}>{truncateSessionId(s)}</option>
          ))}
        </select>

        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-muted border border-border rounded-md px-3 py-2 text-xs text-foreground"
        >
          <option value="">All models</option>
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div>
        {logs.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            No requests captured yet. Configure Claude Code with:
            <pre className="mt-4 text-blue-500 font-mono">
              ANTHROPIC_BASE_URL=http://localhost:3000/proxy claude
            </pre>
          </div>
        ) : (
          logs.map((log) => <LogEntry key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}
