import { Brain, ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { type JSX, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ResponseContentBlockType } from "../../proxy/schemas";
import { Badge } from "../ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { JsonViewer, safeJsonValue } from "../ui/json-viewer";
import { ScrollArea } from "../ui/scroll-area";

function assertNever(_value: never): JSX.Element {
  return <></>;
}

function SystemReminderBlock({ text }: { text: string }): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity group">
        {open ? (
          <ChevronDown className="size-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3 text-muted-foreground" />
        )}
        <span className="text-muted-foreground text-xs italic select-none opacity-60">
          [system-reminder]
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-4 pt-1">
          <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-muted [&_pre]:text-foreground [&_code]:text-[0.8em] [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TextBlock({ text }: { text: string }): JSX.Element {
  if (text.includes("<system-reminder>")) {
    return <SystemReminderBlock text={text} />;
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
              <JsonViewer data={safeJsonValue(input)} defaultExpandDepth={2} />
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
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
