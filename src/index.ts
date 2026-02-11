#!/usr/bin/env bun
import { serve } from "bun";
import { cli } from "cleye";
import index from "./index.html";
import { handleProxy } from "./proxy/handler";
import { getFilteredLogs, getModels, getSessions } from "./proxy/store";

const DEFAULT_PORT = 25947;

const envPort = process.env["PORT"];
const portDefault = envPort !== undefined ? Number(envPort) : DEFAULT_PORT;

const argv = cli({
  name: "cc-inspector",
  flags: {
    port: {
      type: Number,
      alias: "p",
      default: portDefault,
      description: "Port to listen on (env: PORT)",
    },
    open: {
      type: Boolean,
      default: true,
      description: "Open the browser on start (use --no-open to disable)",
    },
  },
});

const server = serve({
  port: argv.flags.port,
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

const openBrowser = (url: string): void => {
  const commandByPlatform: Record<string, string[]> = {
    darwin: ["open", url],
    linux: ["xdg-open", url],
    win32: ["cmd", "/c", "start", url],
  };
  const command = commandByPlatform[process.platform];
  if (command === undefined) {
    return;
  }
  const [bin, ...args] = command;
  if (bin === undefined) {
    return;
  }
  Bun.spawn([bin, ...args], { stdio: ["ignore", "ignore", "ignore"] });
};

console.log(`🚀 Server running at ${server.url}`);
console.log(`   Proxy: ${server.url}proxy`);
console.log(`   Configure: ANTHROPIC_BASE_URL=${server.url}proxy claude`);

if (argv.flags.open) {
  openBrowser(server.url.href);
}
