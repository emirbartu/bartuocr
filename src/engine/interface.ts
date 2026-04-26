export interface OCREngine {
  readonly slug: string;
  readonly displayName: string;
  readonly description: string;
  readonly capabilities: { text: boolean; latex: boolean };

  checkPrerequisites(): Promise<EngineStatus>;
  recognize(imagePath: string, options: OCREngineOptions): Promise<OcrOutput>;
}

export interface OCREngineOptions {
  language?: string;
  mode?: "text" | "math";
  customWords?: string[];
  fast?: boolean;
  languageCorrection?: boolean;
  ignoreLineBreaks?: boolean;
}

export interface OcrOutput {
  text: string | null;
  latex: string | null;
}

export interface EngineStatus {
  ready: boolean;
  message: string;
}
