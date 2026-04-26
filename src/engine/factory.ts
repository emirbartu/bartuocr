import { getPreferenceValues } from "@raycast/api";
import { OCREngine } from "./interface";
import { resolveEngine } from "./registry";
import "./visionkit";
import "./tesseract";
import "./pix2tex";
import "./paddleocr";
import "./glmocr";
import "./deepseekocr";

export function resolveEngineFromPreferences(): OCREngine {
  const preferences = getPreferenceValues<Preferences>();
  const engineSlug = preferences.ocrEngine || "visionkit";
  return resolveEngine(engineSlug);
}
