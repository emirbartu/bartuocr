import {
  OCREngine,
  OCREngineOptions,
  OcrOutput,
  EngineStatus,
} from "./interface";
import { registerEngine } from "./registry";
import { getPreferenceValues } from "@raycast/api";
import { resolveBinary, execFileAsync } from "./binaries";

class TesseractEngine implements OCREngine {
  readonly slug = "tesseract";
  readonly displayName = "Tesseract";
  readonly description =
    "Open-source OCR engine by Google. Fast, supports 100+ languages. Install: brew install tesseract tesseract-lang";
  readonly capabilities = { text: true, latex: false } as const;

  async checkPrerequisites(): Promise<EngineStatus> {
    const tesseractPath = await resolveBinary("tesseract");
    if (tesseractPath) {
      return { ready: true, message: "Tesseract is installed." };
    }
    return {
      ready: false,
      message: "Tesseract not found. Install: brew install tesseract",
    };
  }

  async recognize(
    imagePath: string,
    options: OCREngineOptions,
  ): Promise<OcrOutput> {
    const preference = getPreferenceValues<Preferences>();
    const lang = options.language || preference.tesseractLanguages || "eng";

    const tesseractPath = await resolveBinary("tesseract");
    if (!tesseractPath) {
      throw new Error("Tesseract not found. Install: brew install tesseract");
    }

    try {
      const { stdout } = await execFileAsync(
        tesseractPath,
        [imagePath, "stdout", "-l", lang],
        { timeout: 30000, maxBuffer: 10 * 1024 * 1024 },
      );

      const text = stdout.trim();
      return { text: text || null, latex: null };
    } catch (error) {
      console.error("Tesseract OCR failed:", error);
      throw new Error(
        "Tesseract OCR failed. Is Tesseract installed? brew install tesseract",
      );
    }
  }
}

registerEngine("tesseract", () => new TesseractEngine());
