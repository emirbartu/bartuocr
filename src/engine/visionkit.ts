import {
  OCREngine,
  OCREngineOptions,
  OcrOutput,
  EngineStatus,
} from "./interface";
import { registerEngine } from "./registry";
import { recognizeText as recognizeTextSwift } from "swift:../../swift";
import { getUserSelectedLanguages } from "../hooks";
import { getPreferenceValues } from "@raycast/api";

class VisionKitEngine implements OCREngine {
  readonly slug = "visionkit";
  readonly displayName = "Apple VisionKit";
  readonly description =
    "Built-in macOS OCR using Apple VisionKit. Works offline, supports 17 languages. No LaTeX output.";
  readonly capabilities = { text: true, latex: false } as const;

  async checkPrerequisites(): Promise<EngineStatus> {
    return { ready: true, message: "VisionKit is built into macOS." };
  }

  async recognize(
    imagePath: string,
    options: OCREngineOptions,
  ): Promise<OcrOutput> {
    // VisionKit captures AND OCRs in one Swift call — imagePath is unused
    const preference = getPreferenceValues<Preferences>();
    const languages = await getUserSelectedLanguages();

    const recognizedText = await recognizeTextSwift(
      false, // fullscreen — caller controls capture method, so this is just area mode
      preference.keepImage,
      options.fast ?? preference.ocrMode === "fast",
      options.languageCorrection ?? preference.languageCorrection,
      options.ignoreLineBreaks ?? preference.ignoreLineBreaks,
      options.customWords ??
        (preference.customWordsList
          ? preference.customWordsList.split(",")
          : []),
      languages.map((lang) => lang.value),
      Boolean(preference.playSound),
    );

    return { text: recognizedText || null, latex: null };
  }
}

registerEngine("visionkit", () => new VisionKitEngine());
