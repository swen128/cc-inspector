import { serve } from "bun";
import index from "./index.html";
import { handleProxy } from "./proxy/handler";
import { getFilteredLogs, getSessions, getModels } from "./proxy/store";

const server = serve({
  port: 25947,
  routes: {
    "/api/hello": {
      GET(_req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      PUT(_req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": (req) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    "/api/logs": (req) => {
      const url = new URL(req.url);
      const sessionId = url.searchParams.get("sessionId") ?? undefined;
      const model = url.searchParams.get("model") ?? undefined;
      return Response.json(getFilteredLogs(sessionId, model));
    },

    "/api/sessions": () => Response.json(getSessions()),

    "/api/models": () => Response.json(getModels()),

    "/proxy/*": (req) => handleProxy(req),

    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
console.log(`   Proxy: ${server.url}proxy`);
console.log(`   Configure: ANTHROPIC_BASE_URL=${server.url}proxy claude`);
