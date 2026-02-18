import { createFileRoute } from "@tanstack/react-router";
import { getModels } from "../../proxy/store";

export const Route = createFileRoute("/api/models")({
  server: {
    handlers: {
      GET: () => Response.json(getModels()),
    },
  },
});
