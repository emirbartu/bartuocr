import { readFile } from "fs/promises";
import {
  OCREngine,
  OCREngineOptions,
  OcrOutput,
  EngineStatus,
} from "./interface";
import { registerEngine } from "./registry";
import { getPreferenceValues } from "@raycast/api";
import { isSafeOllamaEndpoint } from "./ollama";

interface OllamaChatResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

function resolveEndpoint(): string {
  const preference = getPreferenceValues<Preferences>();
  const endpoint = preference.ollamaEndpoint || "http://localhost:11434";

  if (!isSafeOllamaEndpoint(endpoint)) {
    throw new Error(
      "Ollama endpoint is not a safe localhost URL. Only http://localhost:11434 or http://127.0.0.1:11434 are allowed.",
    );
  }

  return endpoint;
}

class DeepSeekOCREngine implements OCREngine {
  readonly slug = "deepseekocr";
  readonly displayName = "DeepSeek-OCR (Ollama)";
  readonly description =
    "DeepSeek-OCR via Ollama. Vision-language model optimized for token-efficient OCR. Requires Ollama v0.13.0+. Install: ollama pull deepseek-ocr";
  readonly capabilities = { text: true, latex: true } as const;

  async checkPrerequisites(): Promise<EngineStatus> {
    const preference = getPreferenceValues<Preferences>();
    const endpoint = preference.ollamaEndpoint || "http://localhost:11434";

    if (!isSafeOllamaEndpoint(endpoint)) {
      return {
        ready: false,
        message:
          "Invalid endpoint. Only http://localhost:11434 or http://127.0.0.1:11434 are allowed.",
      };
    }

    try {
      const response = await fetch(`${endpoint}/api/tags`);
      if (!response.ok) {
        return {
          ready: false,
          message: "Ollama server not reachable. Start with: ollama serve",
        };
      }

      const data = (await response.json()) as {
        models?: Array<{ name: string }>;
      };
      const models = data.models || [];
      const hasDeepSeekOCR = models.some((m) =>
        m.name.startsWith("deepseek-ocr"),
      );

      if (!hasDeepSeekOCR) {
        return {
          ready: false,
          message:
            "DeepSeek-OCR model not pulled. Run: ollama pull deepseek-ocr",
        };
      }

      return { ready: true, message: "DeepSeek-OCR model is ready." };
    } catch {
      return {
        ready: false,
        message: "Ollama server not reachable. Start with: ollama serve",
      };
    }
  }

  async recognize(
    imagePath: string,
    options: OCREngineOptions,
  ): Promise<OcrOutput> {
    const endpoint = resolveEndpoint();

    const instruction =
      options.mode === "math"
        ? "Extract all mathematical formulas from this image and output them as LaTeX."
        : "Free OCR.";

    const imageBuffer = await readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");

    try {
      const response = await fetch(`${endpoint}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-ocr",
          messages: [
            {
              role: "user",
              content: instruction,
              images: [base64Image],
            },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as OllamaChatResponse;
      const result = data.message.content.trim();

      if (options.mode === "math") {
        return { text: null, latex: result || null };
      }

      return { text: result || null, latex: null };
    } catch (error) {
      console.error("DeepSeek-OCR failed:", error);
      throw new Error(
        "DeepSeek-OCR failed. Is Ollama running? Start with: ollama serve",
      );
    }
  }
}

registerEngine("deepseekocr", () => new DeepSeekOCREngine());
