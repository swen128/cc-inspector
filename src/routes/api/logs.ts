import { createFileRoute } from "@tanstack/react-router";
import { getFilteredLogs } from "../../proxy/store";

export const Route = createFileRoute("/api/logs")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get("sessionId") ?? undefined;
        const model = url.searchParams.get("model") ?? undefined;
        return Response.json(getFilteredLogs(sessionId, model));
      },
    },
  },
});
