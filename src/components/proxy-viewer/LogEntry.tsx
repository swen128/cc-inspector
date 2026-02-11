import type { JSX } from "react";
import { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { type CapturedLog, parseRequest } from "../../proxy/schemas";
import { JsonViewerFromString } from "../ui/json-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { LogEntryHeader } from "./LogEntryHeader";
import { RequestView } from "./RequestView";
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
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>

            <TabsContent value="request">
              <div className="px-4 py-3">
                {parsedRequest !== null ? (
                  <RequestView request={parsedRequest} />
                ) : (
                  <pre className="font-mono text-xs whitespace-pre-wrap break-words">
                    {log.rawRequestBody ?? "No request body captured"}
                  </pre>
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

            <TabsContent value="raw">
              <div className="px-4 py-3 space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Request</h4>
                  {log.rawRequestBody !== null ? (
                    <JsonViewerFromString text={log.rawRequestBody} defaultExpandDepth={1} />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No request body</p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Response</h4>
                  {log.responseText !== null ? (
                    <JsonViewerFromString text={log.responseText} defaultExpandDepth={1} />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No response body</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
