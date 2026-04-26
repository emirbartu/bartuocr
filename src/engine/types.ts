export interface EngineMetadata {
  slug: string;
  displayName: string;
  description: string;
  requirements: string[];
  capabilities: { text: boolean; latex: boolean };
  category: "builtin" | "cli" | "python" | "ollama";
}
