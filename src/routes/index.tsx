import { createFileRoute } from "@tanstack/react-router";
import { ProxyViewerContainer } from "../components/ProxyViewerContainer";

export const Route = createFileRoute("/")({
  component: ProxyViewerContainer,
});
