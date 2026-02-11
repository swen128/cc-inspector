import { useState, type JSX } from "react";
import ReactMarkdown from "react-markdown";
import {
  Brain,
  Terminal,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ContentBlockType, ResponseContentBlockType } from "../../proxy/schemas";

function assertNever(_value: never): JSX.Element {
  return <></>;
}

export function TextBlock({ text }: { text: string }): JSX.Element {
  const isSystemReminder = text.includes("<system-reminder>");

  if (isSystemReminder) {
    return (
      <div className="text-muted-foreground text-xs italic py-0.5 truncate select-none opacity-60">
        [system-reminder]
      </div>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-muted [&_pre]:text-foreground [&_code]:text-[0.8em] [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

export function ThinkingBlock({ thinking }: { thinking: string }): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-l-2 border-purple-500/40 my-1">
        <CollapsibleTrigger className="flex items-center gap-1.5 px-3 py-1 w-full text-left cursor-pointer hover:bg-purple-500/5 transition-colors rounded-r-sm group">
          <Brain className="size-3.5 text-purple-400 shrink-0" />
          <span className="text-xs font-medium text-purple-400">Thinking</span>
          <Badge
            variant="ghost"
            className="text-[10px] text-muted-foreground px-1.5 py-0 h-4 font-mono"
          >
            {thinking.length.toLocaleString()} chars
          </Badge>
          <span className="flex-1" />
          {open ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-2">
            <ScrollArea className="max-h-[60vh]">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {thinking}
              </pre>
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ToolUseBlock({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-l-2 border-blue-500/40 my-1">
        <CollapsibleTrigger className="flex items-center gap-1.5 px-3 py-1 w-full text-left cursor-pointer hover:bg-blue-500/5 transition-colors rounded-r-sm group">
          <Terminal className="size-3.5 text-blue-400 shrink-0" />
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4">
            {name}
          </Badge>
          <span className="flex-1" />
          {open ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-2">
            <ScrollArea className="max-h-[60vh]">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {JSON.stringify(input, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ToolResultInlineContent({
  content,
}: {
  content:
    | string
    | ReadonlyArray<
        | {
            type: "text";
            text: string;
            cache_control?: { type: string; ttl: string; scope?: string };
          }
        | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
      >;
}): JSX.Element {
  if (typeof content === "string") {
    return (
      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
        {content}
      </pre>
    );
  }

  return (
    <div className="space-y-1">
      {content.map((item, i) => {
        if (item.type === "text") {
          return (
            <pre
              key={i}
              className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed"
            >
              {item.text}
            </pre>
          );
        }
        return <ImageBlock key={i} source={item.source} />;
      })}
    </div>
  );
}

export function ToolResultBlock({
  content,
  isError,
}: {
  content:
    | string
    | ReadonlyArray<
        | {
            type: "text";
            text: string;
            cache_control?: { type: string; ttl: string; scope?: string };
          }
        | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
      >;
  isError?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const hasError = isError === true;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn("border-l-2 my-1", hasError ? "border-red-500/40" : "border-green-500/40")}
      >
        <CollapsibleTrigger
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 w-full text-left cursor-pointer transition-colors rounded-r-sm group",
            hasError ? "hover:bg-red-500/5" : "hover:bg-green-500/5",
          )}
        >
          {hasError ? (
            <AlertCircle className="size-3.5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="size-3.5 text-green-400 shrink-0" />
          )}
          <span className={cn("text-xs font-medium", hasError ? "text-red-400" : "text-green-400")}>
            {hasError ? "Error" : "Result"}
          </span>
          <span className="flex-1" />
          {open ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-2">
            <ScrollArea className="max-h-[60vh]">
              <ToolResultInlineContent content={content} />
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ImageBlock({
  source,
}: {
  source: { type: "base64"; media_type: string; data: string };
}): JSX.Element {
  return (
    <div className="my-1 inline-flex flex-col gap-1">
      <div className="relative rounded-md border border-border overflow-hidden max-w-[400px]">
        <img
          src={`data:${source.media_type};base64,${source.data}`}
          alt="Content image"
          className="block max-w-full h-auto"
        />
      </div>
      <Badge
        variant="ghost"
        className="text-[10px] text-muted-foreground px-1 py-0 h-4 font-mono w-fit"
      >
        <ImageIcon className="size-2.5" />
        {source.media_type}
      </Badge>
    </div>
  );
}

export function ContentBlockRenderer({ block }: { block: ContentBlockType }): JSX.Element {
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
      return <ImageBlock source={block.source} />;
    default:
      return assertNever(block);
  }
}

export function ResponseContentBlockRenderer({
  block,
}: {
  block: ResponseContentBlockType;
}): JSX.Element {
  switch (block.type) {
    case "text":
      return <TextBlock text={block.text} />;
    case "thinking":
      return <ThinkingBlock thinking={block.thinking} />;
    case "tool_use":
      return <ToolUseBlock name={block.name} input={block.input} />;
    default:
      return assertNever(block);
  }
}
