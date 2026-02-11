import { AlertTriangle, StopCircle, Zap } from "lucide-react";
import type { JSX } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "../../lib/utils";
import { type ClaudeResponse, ClaudeResponseSchema } from "../../proxy/schemas";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { ResponseContentBlockRenderer } from "./content-blocks";

export type ResponseViewProps = {
  responseText: string | null;
  responseStatus: number | null;
  streaming: boolean;
  inputTokens: number | null;
  outputTokens: number | null;
};

type StatusCategory = "success" | "client_error" | "server_error" | "pending";

function getStatusCategory(status: number | null): StatusCategory {
  if (status === null) return "pending";
  if (status >= 200 && status < 300) return "success";
  if (status >= 400 && status < 500) return "client_error";
  return "server_error";
}

function getStatusClasses(category: StatusCategory): string {
  switch (category) {
    case "success":
      return "text-emerald-400";
    case "client_error":
      return "text-amber-400";
    case "server_error":
      return "text-red-400";
    case "pending":
      return "text-muted-foreground";
  }
}

function parseResponse(text: string): ClaudeResponse | null {
  try {
    const json: unknown = JSON.parse(text);
    const result = ClaudeResponseSchema.safeParse(json);
    if (result.success) return result.data;
    return null;
  } catch {
    return null;
  }
}

function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  return count.toLocaleString();
}

function StatusIndicator({ status }: { status: number | null }): JSX.Element {
  const category = getStatusCategory(status);
  const classes = getStatusClasses(category);

  if (status === null) {
    return <span className="text-xs text-muted-foreground italic">pending</span>;
  }

  return (
    <span className={cn("flex items-center gap-1 text-xs font-mono font-semibold", classes)}>
      {category === "server_error" && <AlertTriangle className="size-3" />}
      {status}
    </span>
  );
}

function StructuredResponseView({ response }: { response: ClaudeResponse }): JSX.Element {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-mono">
          {response.model}
        </Badge>

        {response.stop_reason !== null && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-5 font-mono flex items-center gap-1"
          >
            <StopCircle className="size-2.5" />
            {response.stop_reason}
          </Badge>
        )}

        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <Zap className="size-3" />
          <span className="font-mono tabular-nums">
            {formatTokens(response.usage.input_tokens)} in /{" "}
            {formatTokens(response.usage.output_tokens)} out
          </span>
        </span>
      </div>

      <Separator className="opacity-50" />

      <div className="space-y-2">
        {response.content.map((block, i) => (
          <ResponseContentBlockRenderer key={i} block={block} />
        ))}
        {response.content.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Empty response content</p>
        )}
      </div>
    </div>
  );
}

function ErrorResponseView({ text }: { text: string }): JSX.Element {
  return (
    <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
      <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[60vh]">
        {text}
      </pre>
    </div>
  );
}

function MarkdownFallbackView({ text }: { text: string }): JSX.Element {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-muted [&_pre]:text-foreground [&_code]:text-[0.8em] [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

export function ResponseView({
  responseText,
  responseStatus,
  streaming,
  inputTokens,
  outputTokens,
}: ResponseViewProps): JSX.Element {
  if (responseText === null) {
    return (
      <div className="flex items-center gap-2 py-3">
        <StatusIndicator status={responseStatus} />
        <span className="text-xs text-muted-foreground italic">No response</span>
      </div>
    );
  }

  const isError = responseStatus !== null && responseStatus >= 400;

  if (isError) {
    return (
      <div className="space-y-2">
        <StatusIndicator status={responseStatus} />
        <ErrorResponseView text={responseText} />
      </div>
    );
  }

  if (streaming) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusIndicator status={responseStatus} />
          {(inputTokens !== null || outputTokens !== null) && (
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
              <Zap className="size-3" />
              <span className="font-mono tabular-nums">
                {inputTokens !== null ? formatTokens(inputTokens) : "—"} in /{" "}
                {outputTokens !== null ? formatTokens(outputTokens) : "—"} out
              </span>
            </span>
          )}
        </div>
        <MarkdownFallbackView text={responseText} />
      </div>
    );
  }

  const parsed = parseResponse(responseText);

  if (parsed !== null) {
    return (
      <div className="space-y-2">
        <StatusIndicator status={responseStatus} />
        <StructuredResponseView response={parsed} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <StatusIndicator status={responseStatus} />
      <MarkdownFallbackView text={responseText} />
    </div>
  );
}
