import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import { type JSX, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { JsonViewer, safeJsonValue } from "@/components/ui/json-viewer";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ToolDefinitionType } from "../../proxy/schemas";

function truncateDescription(description: string, max: number): string {
  if (description.length <= max) return description;
  return `${description.slice(0, max)}…`;
}

function ToolItem({ tool }: { tool: ToolDefinitionType }): JSX.Element {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 px-3 py-1 w-full text-left cursor-pointer hover:bg-cyan-500/5 transition-colors rounded-sm group">
        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4 shrink-0">
          {tool.name}
        </Badge>
        {tool.description !== undefined && (
          <span className="text-muted-foreground text-xs truncate">
            {truncateDescription(tool.description, 60)}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-2 pt-1 space-y-2">
          {tool.description !== undefined && (
            <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
              <ReactMarkdown>{tool.description}</ReactMarkdown>
            </div>
          )}
          {tool.input_schema !== undefined && (
            <ScrollArea className="max-h-[40vh]">
              <JsonViewer data={safeJsonValue(tool.input_schema)} defaultExpandDepth={1} />
            </ScrollArea>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export type ToolDefinitionsProps = {
  tools: ToolDefinitionType[];
};

export function ToolDefinitions({ tools }: ToolDefinitionsProps): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-l-2 border-cyan-500/40 pl-3">
        <CollapsibleTrigger className="flex items-center gap-1.5 py-1 w-full text-left cursor-pointer hover:bg-cyan-500/5 transition-colors rounded-r-sm group">
          <Wrench className="size-3.5 text-cyan-400 shrink-0" />
          <span className="text-xs font-medium text-cyan-400">Tools</span>
          <Badge
            variant="ghost"
            className="text-[10px] text-muted-foreground px-1.5 py-0 h-4 font-mono"
          >
            {tools.length}
          </Badge>
          <span className="flex-1" />
          {open ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-1 pt-1">
            {tools.map((tool) => (
              <ToolItem key={tool.name} tool={tool} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
