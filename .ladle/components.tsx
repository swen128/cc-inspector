import type { GlobalProvider } from "@ladle/react";
import "../src/index.css";

export const Provider: GlobalProvider = ({ children }) => (
  <div className="bg-background text-foreground p-4">{children}</div>
);
