import {
  OCREngine,
  OCREngineOptions,
  OcrOutput,
  EngineStatus,
} from "./interface";
import { registerEngine } from "./registry";
import { resolveBinary, execFileAsync } from "./binaries";

let warmedUp = false;
let warmingUp: Promise<void> | null = null;

async function ensurePaddleOCRWarmup(): Promise<void> {
  if (warmingUp) {
    return warmingUp;
  }
  if (warmedUp) {
    return;
  }

  warmingUp = (async () => {
    const uvPath = await resolveBinary("uv");
    if (!uvPath) {
      throw new Error(
        "uv not found. Install: curl -LsSf https://astral.sh/uv/install.sh | sh",
      );
    }

    await execFileAsync(
      uvPath,
      [
        "tool",
        "run",
        "--from",
        "paddleocr",
        "python3",
        "-c",
        "import paddleocr",
      ],
      {
        timeout: 300000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    warmedUp = true;
    warmingUp = null;
  })().catch((error) => {
    console.error("PaddleOCR warmup failed:", error);
    warmingUp = null;
  });

  return warmingUp;
}

class PaddleOCREngine implements OCREngine {
  readonly slug = "paddleocr";
  readonly displayName = "PaddleOCR";
  readonly description =
    "Baidu's OCR engine with PP-OCRv5. Supports text recognition and formula-to-LaTeX pipeline. Uses uvx for auto-install.";
  readonly capabilities = { text: true, latex: true } as const;

  async checkPrerequisites(): Promise<EngineStatus> {
    const uvPath = await resolveBinary("uv");
    if (!uvPath) {
      return {
        ready: false,
        message:
          "uv not found. Install: curl -LsSf https://astral.sh/uv/install.sh | sh",
      };
    }

    ensurePaddleOCRWarmup().catch(() => {});

    return {
      ready: true,
      message:
        "uv is installed. PaddleOCR will auto-install via uvx on first run.",
    };
  }

  async recognize(
    imagePath: string,
    options: OCREngineOptions,
  ): Promise<OcrOutput> {
    await ensurePaddleOCRWarmup();

    const uvxPath = await resolveBinary("uvx");
    if (!uvxPath) {
      throw new Error(
        "uvx not found. Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh",
      );
    }

    try {
      if (options.mode === "math") {
        const { stdout } = await execFileAsync(
          uvxPath,
          [
            "paddleocr",
            "formula_recognition_pipeline",
            "-i",
            imagePath,
            "--device",
            "cpu",
          ],
          { timeout: 120000, maxBuffer: 10 * 1024 * 1024 },
        );

        try {
          const parsed = JSON.parse(stdout);
          const latex =
            typeof parsed === "string"
              ? parsed
              : parsed.latex || parsed.formula || JSON.stringify(parsed);
          return { text: null, latex };
        } catch {
          const text = stdout.trim();
          return { text: null, latex: text || null };
        }
      }

      const { stdout } = await execFileAsync(
        uvxPath,
        ["paddleocr", "ocr", "-i", imagePath, "--device", "cpu"],
        { timeout: 120000, maxBuffer: 10 * 1024 * 1024 },
      );

      const text = stdout.trim();
      return { text: text || null, latex: null };
    } catch (error) {
      console.error("PaddleOCR failed:", error);
      throw new Error(
        "PaddleOCR failed. Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh",
      );
    }
  }
}

registerEngine("paddleocr", () => new PaddleOCREngine());
