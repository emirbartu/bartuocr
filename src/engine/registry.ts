import { OCREngine } from "./interface";

const engineRegistry = new Map<string, () => OCREngine>();

export function registerEngine(slug: string, factory: () => OCREngine): void {
  engineRegistry.set(slug, factory);
}

export function resolveEngine(slug: string): OCREngine {
  const factory = engineRegistry.get(slug);
  if (!factory) {
    const fallback = engineRegistry.get("visionkit");
    if (!fallback) {
      throw new Error(
        "No OCR engine available. VisionKit engine not registered.",
      );
    }
    return fallback();
  }
  return factory();
}

export function getAvailableEngines(): string[] {
  return Array.from(engineRegistry.keys());
}
