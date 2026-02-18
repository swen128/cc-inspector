#!/usr/bin/env bun
import { cli } from "cleye";

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

process.env["PORT"] = String(argv.flags.port);

const url = `http://localhost:${argv.flags.port}`;

console.log(`Server running at ${url}`);
console.log(`   Proxy: ${url}/proxy`);
console.log(`   Configure: ANTHROPIC_BASE_URL=${url}/proxy claude`);

const openBrowser = (targetUrl: string): void => {
  const commandByPlatform: Record<string, string[]> = {
    darwin: ["open", targetUrl],
    linux: ["xdg-open", targetUrl],
    win32: ["cmd", "/c", "start", targetUrl],
  };
  const command = commandByPlatform[process.platform];
  if (command === undefined) return;
  const [bin, ...args] = command;
  if (bin === undefined) return;
  Bun.spawn([bin, ...args], { stdio: ["ignore", "ignore", "ignore"] });
};

if (argv.flags.open) {
  openBrowser(url);
}

await import("../.output/server/index.mjs");
