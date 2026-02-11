import { Settings } from "lucide-react";
import type { JSX } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ClaudeRequest } from "../../proxy/schemas";
import { MessageThread } from "./MessageThread";
import { SystemPrompt } from "./SystemPrompt";
import { ToolDefinitions } from "./ToolDefinitions";

function formatBudget(budget: number): string {
  if (budget < 1000) return `${budget}`;
  return `${(budget / 1000).toFixed(0)}k`;
}

export type RequestViewProps = {
  request: ClaudeRequest;
};

export function RequestView({ request }: RequestViewProps): JSX.Element {
  const hasSystem = request.system !== undefined && request.system.length > 0;
  const hasTools = request.tools !== undefined && request.tools.length > 0;

  const thinkingEnabled = request.thinking !== undefined && request.thinking.type === "enabled";

  const hasConfigBadges =
    request.max_tokens !== undefined ||
    request.temperature !== undefined ||
    thinkingEnabled ||
    request.stream === true;

  const showSeparator = hasConfigBadges || hasSystem || hasTools;

  return (
    <div className="space-y-3">
      {/* Config bar */}
      {hasConfigBadges && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Settings className="size-3 text-muted-foreground shrink-0" />
          {request.max_tokens !== undefined && (
            <Badge variant="outline" className="text-xs font-mono px-1.5 py-0 h-5">
              max: {request.max_tokens}
            </Badge>
          )}
          {request.temperature !== undefined && (
            <Badge variant="outline" className="text-xs font-mono px-1.5 py-0 h-5">
              temp: {request.temperature}
            </Badge>
          )}
          {thinkingEnabled &&
            request.thinking !== undefined &&
            request.thinking.type === "enabled" && (
              <Badge variant="outline" className="text-xs font-mono px-1.5 py-0 h-5">
                thinking: {formatBudget(request.thinking.budget_tokens)} budget
              </Badge>
            )}
          {request.stream === true && (
            <Badge variant="outline" className="text-xs font-mono px-1.5 py-0 h-5">
              streaming
            </Badge>
          )}
        </div>
      )}

      {/* System prompt */}
      {hasSystem && request.system !== undefined && <SystemPrompt blocks={request.system} />}

      {/* Tool definitions */}
      {hasTools && request.tools !== undefined && <ToolDefinitions tools={request.tools} />}

      {/* Separator between config/system/tools and messages */}
      {showSeparator && <Separator />}

      {/* Message thread */}
      <MessageThread messages={request.messages} />
    </div>
  );
}
