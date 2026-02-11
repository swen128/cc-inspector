import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { type JSX, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { SystemBlockType } from "../../proxy/schemas";

function formatCharCount(count: number): string {
  if (count < 1000) return `${count} chars`;
  return `${(count / 1000).toFixed(1)}k chars`;
}

export type SystemPromptProps = {
  blocks: SystemBlockType[];
};

export function SystemPrompt({ blocks }: SystemPromptProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const totalChars = blocks.reduce((sum, block) => sum + block.text.length, 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-l-2 border-yellow-500/40 pl-3">
        <CollapsibleTrigger className="flex items-center gap-1.5 py-1 w-full text-left cursor-pointer hover:bg-yellow-500/5 transition-colors rounded-r-sm group">
          <FileText className="size-3.5 text-yellow-400 shrink-0" />
          <span className="text-xs font-medium text-yellow-400">System</span>
          <Badge
            variant="ghost"
            className="text-[10px] text-muted-foreground px-1.5 py-0 h-4 font-mono"
          >
            {blocks.length} {blocks.length === 1 ? "block" : "blocks"} &middot;{" "}
            {formatCharCount(totalChars)}
          </Badge>
          <span className="flex-1" />
          {open ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className={cn("max-h-[60vh] overflow-auto", "pb-2 space-y-3")}>
            {blocks.map((block, i) => (
              <div key={i} className="relative">
                {block.cache_control !== undefined && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-3.5 font-mono absolute top-0 right-0"
                  >
                    cached
                  </Badge>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-muted [&_pre]:text-foreground [&_code]:text-[0.8em] [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                  <ReactMarkdown>{block.text}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
