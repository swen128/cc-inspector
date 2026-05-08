import type { JSX } from "react";
import { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { type CapturedLog, parseRequest } from "../../proxy/schemas";
import { JsonViewerFromString } from "../ui/json-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { LogEntryHeader } from "./LogEntryHeader";
import { ResponseView } from "./ResponseView";

export type LogEntryProps = {
  log: CapturedLog;
};

export function LogEntry({ log }: LogEntryProps): JSX.Element {
  const [expanded, setExpanded] = useState<boolean>(false);
  const parsedRequest = useMemo(() => parseRequest(log.rawRequestBody), [log.rawRequestBody]);

  return (
    <div className={cn("border border-border rounded-lg mb-3 overflow-hidden")}>
      <LogEntryHeader
        log={log}
        parsedRequest={parsedRequest}
        expanded={expanded}
        onToggle={() => {
          setExpanded(!expanded);
        }}
      />

      {expanded && (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
        >
          <Tabs defaultValue="request">
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
            </TabsList>

            <TabsContent value="request">
              <div className="px-4 py-3">
                {log.rawRequestBody !== null ? (
                  <JsonViewerFromString text={log.rawRequestBody} defaultExpandDepth={1} />
                ) : (
                  <p className="text-xs text-muted-foreground italic">No request body</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="response">
              <div className="px-4 py-3">
                <ResponseView
                  responseText={log.responseText}
                  responseStatus={log.responseStatus}
                  streaming={log.streaming}
                  inputTokens={log.inputTokens}
                  outputTokens={log.outputTokens}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
