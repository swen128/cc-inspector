import { createFileRoute } from "@tanstack/react-router";
import { handleProxy } from "../../proxy/handler";

export const Route = createFileRoute("/proxy/$")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => handleProxy(request),
      POST: ({ request }: { request: Request }) => handleProxy(request),
      PUT: ({ request }: { request: Request }) => handleProxy(request),
      DELETE: ({ request }: { request: Request }) => handleProxy(request),
      PATCH: ({ request }: { request: Request }) => handleProxy(request),
      OPTIONS: ({ request }: { request: Request }) => handleProxy(request),
    },
  },
});
