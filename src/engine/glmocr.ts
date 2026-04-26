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

interface OllamaGenerateResponse {
  model: string;
  response: string;
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

class GLMOCREngine implements OCREngine {
  readonly slug = "glmocr";
  readonly displayName = "GLM-OCR (Ollama)";
  readonly description =
    "GLM-OCR via Ollama. 0.9B vision-language model for text, formula, and table recognition. Install: ollama pull glm-ocr";
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
      const hasGLMOCR = models.some((m) => m.name.startsWith("glm-ocr"));

      if (!hasGLMOCR) {
        return {
          ready: false,
          message: "GLM-OCR model not pulled. Run: ollama pull glm-ocr",
        };
      }

      return { ready: true, message: "GLM-OCR model is ready." };
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

    const prompt =
      options.mode === "math" ? "Formula Recognition:" : "Text Recognition:";

    const imageBuffer = await readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");

    try {
      const response = await fetch(`${endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "glm-ocr",
          prompt: prompt,
          images: [base64Image],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as OllamaGenerateResponse;
      const result = data.response.trim();

      if (options.mode === "math") {
        return { text: null, latex: result || null };
      }

      return { text: result || null, latex: null };
    } catch (error) {
      console.error("GLM-OCR failed:", error);
      throw new Error(
        "GLM-OCR failed. Is Ollama running? Start with: ollama serve",
      );
    }
  }
}

registerEngine("glmocr", () => new GLMOCREngine());
