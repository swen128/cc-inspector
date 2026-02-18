import { createFileRoute } from "@tanstack/react-router";
import { getSessions } from "../../proxy/store";

export const Route = createFileRoute("/api/sessions")({
  server: {
    handlers: {
      GET: () => Response.json(getSessions()),
    },
  },
});
