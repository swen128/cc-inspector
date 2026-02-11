import { Bot, User } from "lucide-react";
import type { JSX } from "react";
import { cn } from "../../lib/utils";
import type { MessageType } from "../../proxy/schemas";
import { ContentBlockRenderer, TextBlock } from "./content-blocks";

export type MessageThreadProps = {
  messages: MessageType[];
};

export function MessageThread({ messages }: MessageThreadProps): JSX.Element {
  return (
    <div>
      {messages.map((message, msgIndex) => (
        <div
          key={`msg-${String(msgIndex)}`}
          className={cn(
            "border-b border-border/50 last:border-b-0",
            "border-l-2 pl-3 py-2",
            message.role === "user" ? "border-l-green-500/40" : "border-l-orange-500/40",
          )}
        >
          {/* Role label */}
          <div className="flex items-center gap-1.5 mb-1.5">
            {message.role === "user" ? (
              <>
                <User className="size-3.5 text-green-400 shrink-0" />
                <span className="text-xs font-bold font-mono text-green-400">USER</span>
              </>
            ) : (
              <>
                <Bot className="size-3.5 text-orange-400 shrink-0" />
                <span className="text-xs font-bold font-mono text-orange-400">ASSISTANT</span>
              </>
            )}
          </div>

          {/* Content blocks */}
          <div className="space-y-1">
            {typeof message.content === "string" ? (
              <TextBlock text={message.content} />
            ) : (
              message.content.map((block, blockIndex) => (
                <ContentBlockRenderer
                  key={`msg-${String(msgIndex)}-block-${String(blockIndex)}`}
                  block={block}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
