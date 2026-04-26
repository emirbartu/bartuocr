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

async function ensurePix2texWarmup(): Promise<void> {
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
      ["tool", "run", "--from", "pix2tex", "python3", "-c", "import pix2tex"],
      {
        timeout: 300000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    warmedUp = true;
    warmingUp = null;
  })().catch((error) => {
    console.error("pix2tex warmup failed:", error);
    warmingUp = null;
  });

  return warmingUp;
}

class Pix2texEngine implements OCREngine {
  readonly slug = "pix2tex";
  readonly displayName = "LaTeX-OCR (pix2tex)";
  readonly description =
    "Converts formula screenshots to LaTeX using ViT+Transformer model. Uses uv for auto-install. Math formulas only.";
  readonly capabilities = { text: false, latex: true } as const;

  async checkPrerequisites(): Promise<EngineStatus> {
    const uvPath = await resolveBinary("uv");
    if (!uvPath) {
      return {
        ready: false,
        message:
          "uv not found. Install: curl -LsSf https://astral.sh/uv/install.sh | sh",
      };
    }

    ensurePix2texWarmup().catch(() => {});

    return {
      ready: true,
      message:
        "uv is installed. pix2tex will auto-install via uv on first run.",
    };
  }

  async recognize(
    imagePath: string,
    _options: OCREngineOptions,
  ): Promise<OcrOutput> {
    await ensurePix2texWarmup();

    const uvPath = await resolveBinary("uv");
    if (!uvPath) {
      throw new Error(
        "uv not found. Install: curl -LsSf https://astral.sh/uv/install.sh | sh",
      );
    }

    const script = `from pix2tex.cli import LatexOCR
import sys
from PIL import Image
model = LatexOCR()
img = Image.open(sys.argv[1])
print(model(img))`;

    try {
      const { stdout } = await execFileAsync(
        uvPath,
        [
          "tool",
          "run",
          "--from",
          "pix2tex",
          "python3",
          "-c",
          script,
          imagePath,
        ],
        {
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
          env: {
            ...process.env,
            MPLBACKEND: "Agg",
          },
        },
      );

      const latex = stdout.trim();
      return { text: null, latex: latex || null };
    } catch (error) {
      console.error("pix2tex OCR failed:", error);
      throw new Error(
        "pix2tex failed. Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh",
      );
    }
  }
}

registerEngine("pix2tex", () => new Pix2texEngine());
