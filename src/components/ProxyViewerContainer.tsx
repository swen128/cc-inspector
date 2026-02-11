import { useState, useEffect, useCallback, type JSX } from "react";
import { z } from "zod";
import { CapturedLogSchema, type CapturedLog } from "../proxy/schemas";
import { ProxyViewer } from "./ProxyViewer";

export function ProxyViewerContainer(): JSX.Element {
  const [logs, setLogs] = useState<CapturedLog[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState("__all__");
  const [selectedModel, setSelectedModel] = useState("__all__");

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedSession !== "__all__") params.set("sessionId", selectedSession);
    if (selectedModel !== "__all__") params.set("model", selectedModel);

    const [logsRes, sessionsRes, modelsRes] = await Promise.all([
      fetch(`/api/logs?${params}`),
      fetch("/api/sessions"),
      fetch("/api/models"),
    ]);

    setLogs(z.array(CapturedLogSchema).parse(await logsRes.json()));
    setSessions(z.array(z.string()).parse(await sessionsRes.json()));
    setModels(z.array(z.string()).parse(await modelsRes.json()));
  }, [selectedSession, selectedModel]);

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => {
      void fetchData();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <ProxyViewer
      logs={logs}
      sessions={sessions}
      models={models}
      selectedSession={selectedSession}
      selectedModel={selectedModel}
      onSessionChange={setSelectedSession}
      onModelChange={setSelectedModel}
    />
  );
}
