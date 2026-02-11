import { ChevronDown, ChevronRight, Clock, MessageSquare, Radio, Wrench, Zap } from "lucide-react";
import type { JSX } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CapturedLog, ClaudeRequest } from "@/proxy/schemas";

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

type StatusCategory = "success" | "client_error" | "server_error" | "pending";

function getStatusCategory(status: number | null): StatusCategory {
  if (status === null) return "pending";
  if (status >= 200 && status < 300) return "success";
  if (status >= 400 && status < 500) return "client_error";
  return "server_error";
}

const STATUS_BADGE_CLASSES: Record<StatusCategory, string> = {
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  client_error: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  server_error: "",
  pending: "bg-muted text-muted-foreground border-border",
};

export type LogEntryHeaderProps = {
  log: CapturedLog;
  parsedRequest: ClaudeRequest | null;
  expanded: boolean;
  onToggle: () => void;
};

export function LogEntryHeader({
  log,
  parsedRequest,
  expanded,
  onToggle,
}: LogEntryHeaderProps): JSX.Element {
  const statusCategory = getStatusCategory(log.responseStatus);

  const hasTokens = log.inputTokens !== null || log.outputTokens !== null;

  const messageCount = parsedRequest !== null ? parsedRequest.messages.length : null;

  const toolCount =
    parsedRequest !== null && parsedRequest.tools !== undefined && parsedRequest.tools.length > 0
      ? parsedRequest.tools.length
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors",
        "hover:bg-muted/50",
        "select-none",
      )}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {/* Request ID */}
      <span className="text-blue-400/80 font-mono text-xs font-semibold tabular-nums shrink-0">
        #{log.id}
      </span>

      {/* Model */}
      {log.model !== null && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-mono">
          {log.model}
        </Badge>
      )}

      {/* Response Status */}
      {statusCategory === "server_error" ? (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 font-mono tabular-nums">
          {log.responseStatus}
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 h-5 font-mono tabular-nums",
            STATUS_BADGE_CLASSES[statusCategory],
          )}
        >
          {log.responseStatus !== null ? log.responseStatus : "..."}
        </Badge>
      )}

      {/* Elapsed time */}
      {log.elapsedMs !== null && (
        <span className="flex items-center gap-1 text-muted-foreground text-xs shrink-0">
          <Clock className="size-3" />
          <span className="font-mono tabular-nums">{formatElapsed(log.elapsedMs)}</span>
        </span>
      )}

      {/* Token counts */}
      {hasTokens && (
        <span className="flex items-center gap-1 text-muted-foreground text-xs shrink-0">
          <Zap className="size-3" />
          <span className="font-mono tabular-nums">
            {log.inputTokens !== null ? log.inputTokens.toLocaleString() : "—"}
            {" / "}
            {log.outputTokens !== null ? log.outputTokens.toLocaleString() : "—"}
          </span>
        </span>
      )}

      {/* Message count */}
      {messageCount !== null && (
        <span className="flex items-center gap-1 text-muted-foreground text-xs shrink-0">
          <MessageSquare className="size-3" />
          <span className="font-mono tabular-nums">{messageCount}</span>
        </span>
      )}

      {/* Tool count */}
      {toolCount !== null && (
        <span className="flex items-center gap-1 text-muted-foreground text-xs shrink-0">
          <Wrench className="size-3" />
          <span className="font-mono tabular-nums">{toolCount}</span>
        </span>
      )}

      {/* Streaming indicator */}
      {log.streaming && <Radio className="size-3 text-muted-foreground/60 shrink-0" />}

      {/* Spacer */}
      <span className="flex-1 min-w-0" />

      {/* Expand chevron */}
      {expanded ? (
        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
      ) : (
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      )}
    </div>
  );
}
