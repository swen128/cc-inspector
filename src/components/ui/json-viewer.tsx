import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { type JSX, useState } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | ReadonlyArray<JsonValue> | Readonly<{ [key: string]: JsonValue }>;

type DataType = "string" | "number" | "boolean" | "null" | "array" | "object";

function classifyValue(value: JsonValue): DataType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object":
      return "object";
    case "bigint":
    case "symbol":
    case "undefined":
    case "function":
      return "object";
  }
}

function isExpandable(value: JsonValue): boolean {
  return value !== null && (Array.isArray(value) || typeof value === "object");
}

function getPropertyValue(obj: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(obj, key);
  if (descriptor === undefined) return undefined;
  return descriptor.value;
}

function getEntries(value: JsonValue): ReadonlyArray<readonly [string, JsonValue]> {
  if (Array.isArray(value)) {
    return value.map((item, index) => [String(index), item] as const);
  }
  if (typeof value === "object" && value !== null) {
    return Object.keys(value).map((key) => {
      const raw = getPropertyValue(value, key);
      return [key, safeJsonValue(raw)] as const;
    });
  }
  return [];
}

function getItemCount(value: JsonValue): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "object" && value !== null) return Object.keys(value).length;
  return 0;
}

const STRING_TRUNCATE_LIMIT = 120;

function StringValue({ text }: { text: string }): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > STRING_TRUNCATE_LIMIT;

  if (!isLong) {
    return (
      <span className="text-emerald-400 break-all">
        &quot;
        <span className="prose prose-sm dark:prose-invert inline max-w-none [&_p]:inline [&_p]:my-0 [&_code]:text-emerald-300 [&_a]:text-emerald-300">
          <ReactMarkdown>{text}</ReactMarkdown>
        </span>
        &quot;
      </span>
    );
  }

  return (
    <span className="text-emerald-400 break-all">
      &quot;
      {expanded ? (
        <span
          className="cursor-pointer prose prose-sm dark:prose-invert inline max-w-none [&_p]:inline [&_p]:my-0 [&_code]:text-emerald-300 [&_a]:text-emerald-300"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              setExpanded(false);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <ReactMarkdown>{text}</ReactMarkdown>
        </span>
      ) : (
        <Tooltip delayDuration={300}>
          <TooltipTrigger
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
            className="text-left cursor-pointer"
          >
            <span>{text.slice(0, STRING_TRUNCATE_LIMIT)}</span>
            <span className="text-emerald-400/50">…</span>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="max-w-md text-xs p-2 break-words whitespace-pre-wrap"
          >
            {text.slice(0, 500)}
            {text.length > 500 ? "…" : ""}
          </TooltipContent>
        </Tooltip>
      )}
      &quot;
    </span>
  );
}

function PrimitiveValue({ value }: { value: JsonValue }): JSX.Element {
  if (value === null) {
    return <span className="text-rose-400 italic">null</span>;
  }

  switch (typeof value) {
    case "string":
      return <StringValue text={value} />;
    case "number":
      return <span className="text-amber-400">{value}</span>;
    case "boolean":
      return <span className="text-blue-400">{value ? "true" : "false"}</span>;
    case "object":
    case "bigint":
    case "symbol":
    case "undefined":
    case "function":
      return <span className="text-muted-foreground">{JSON.stringify(value)}</span>;
  }
}

function CopyButton({ value }: { value: JsonValue }): JSX.Element {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent): void {
    e.stopPropagation();
    void window.navigator.clipboard.writeText(JSON.stringify(value, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="opacity-0 group-hover/row:opacity-100 hover:bg-muted p-0.5 rounded transition-opacity shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="size-3 text-green-500" />
      ) : (
        <Copy className="size-3 text-muted-foreground" />
      )}
    </button>
  );
}

type JsonNodeProps = {
  name: string;
  value: JsonValue;
  level: number;
  defaultExpandDepth: number;
  isArrayItem: boolean;
};

function JsonNode({
  name,
  value,
  level,
  defaultExpandDepth,
  isArrayItem,
}: JsonNodeProps): JSX.Element {
  const [expanded, setExpanded] = useState(level < defaultExpandDepth);
  const expandable = isExpandable(value);

  const dataType = classifyValue(value);
  const openBracket = dataType === "array" ? "[" : "{";
  const closeBracket = dataType === "array" ? "]" : "}";

  return (
    <div className={cn(level > 0 && "border-l border-border/50 ml-2")}>
      <div
        className={cn(
          "flex items-start gap-1 py-0.5 px-1 -ml-1 rounded-sm group/row",
          expandable && "cursor-pointer hover:bg-muted/50",
        )}
        onClick={
          expandable
            ? () => {
                setExpanded(!expanded);
              }
            : undefined
        }
        onKeyDown={
          expandable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpanded(!expanded);
                }
              }
            : undefined
        }
        role={expandable ? "button" : undefined}
        tabIndex={expandable ? 0 : undefined}
      >
        {expandable ? (
          <span className="w-4 h-5 flex items-center justify-center shrink-0">
            {expanded ? (
              <ChevronDown className="size-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3 text-muted-foreground" />
            )}
          </span>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <span className={cn("shrink-0", isArrayItem ? "text-muted-foreground" : "text-cyan-400")}>
          {isArrayItem ? name : `"${name}"`}
        </span>

        <span className="text-muted-foreground shrink-0">{expandable ? "" : ":"}</span>

        {expandable ? (
          <span className="text-muted-foreground">
            {openBracket}
            {!expanded && (
              <span className="text-muted-foreground/60 text-xs">
                {" "}
                {getItemCount(value)} {getItemCount(value) === 1 ? "item" : "items"} {closeBracket}
              </span>
            )}
          </span>
        ) : (
          <span className="min-w-0">
            <PrimitiveValue value={value} />
          </span>
        )}

        <span className="ml-auto shrink-0 flex items-center">
          <CopyButton value={value} />
        </span>
      </div>

      {expandable && expanded && (
        <div className="pl-4">
          {getEntries(value).map(([key, childValue]) => (
            <JsonNode
              key={key}
              name={key}
              value={childValue}
              level={level + 1}
              defaultExpandDepth={defaultExpandDepth}
              isArrayItem={dataType === "array"}
            />
          ))}
          <div className="text-muted-foreground py-0.5 px-1">{closeBracket}</div>
        </div>
      )}
    </div>
  );
}

export type JsonViewerProps = {
  data: JsonValue;
  defaultExpandDepth?: number;
  className?: string;
};

export function JsonViewer({
  data,
  defaultExpandDepth = 2,
  className,
}: JsonViewerProps): JSX.Element {
  const expandable = isExpandable(data);

  if (!expandable) {
    return (
      <TooltipProvider>
        <div className={cn("font-mono text-xs leading-relaxed", className)}>
          <PrimitiveValue value={data} />
        </div>
      </TooltipProvider>
    );
  }

  const dataType = classifyValue(data);
  const isArray = dataType === "array";

  return (
    <TooltipProvider>
      <div className={cn("font-mono text-xs leading-relaxed", className)}>
        {getEntries(data).map(([key, childValue]) => (
          <JsonNode
            key={key}
            name={key}
            value={childValue}
            level={0}
            defaultExpandDepth={defaultExpandDepth}
            isArrayItem={isArray}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}

export type JsonViewerFromStringProps = {
  text: string;
  defaultExpandDepth?: number;
  className?: string;
};

export function JsonViewerFromString({
  text,
  defaultExpandDepth = 2,
  className,
}: JsonViewerFromStringProps): JSX.Element {
  try {
    const parsed: unknown = JSON.parse(text);
    return (
      <JsonViewer
        data={safeJsonValue(parsed)}
        defaultExpandDepth={defaultExpandDepth}
        className={className}
      />
    );
  } catch {
    return (
      <pre className={cn("font-mono text-xs whitespace-pre-wrap break-words", className)}>
        {text}
      </pre>
    );
  }
}

export function safeJsonValue(value: unknown): JsonValue {
  if (value === null || value === undefined) return null;
  switch (typeof value) {
    case "string":
      return value;
    case "number":
      return value;
    case "boolean":
      return value;
    case "object": {
      if (Array.isArray(value)) {
        return value.map((item: unknown) => safeJsonValue(item));
      }
      const result: Record<string, JsonValue> = {};
      for (const key of Object.keys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        result[key] = safeJsonValue(descriptor?.value);
      }
      return result;
    }
    case "bigint":
    case "symbol":
    case "function":
    case "undefined":
      return String(value);
  }
  return null;
}
