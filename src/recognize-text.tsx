import {
  Clipboard,
  closeMainWindow,
  LaunchProps,
  getPreferenceValues,
} from "@raycast/api";
import { callbackLaunchCommand } from "raycast-cross-extension";
import { showSuccessToast, showFailureToast } from "./utils";
import { OCRResult, LaunchContext } from "./types";
import { resolveEngineFromPreferences } from "./engine/factory";
import {
  captureImage as captureImageSwift,
  cleanupImage as cleanupImageSwift,
} from "swift:../swift";

export default async function command({
  launchContext,
}: LaunchProps<{ launchContext?: LaunchContext }>) {
  await closeMainWindow();

  const callbackOptions = launchContext?.callbackLaunchOptions;
  const preference = getPreferenceValues<Preferences>();
  const engine = resolveEngineFromPreferences();

  let imagePath = "";

  try {
    if (engine.slug !== "visionkit") {
      imagePath = await captureImageSwift(
        false,
        preference.keepImage,
        Boolean(preference.playSound),
      );

      if (!imagePath) {
        await showFailureToast("Failed to capture screen", {
          title: "Capture failed",
        });
        if (callbackOptions) {
          await callbackLaunchCommand(callbackOptions, {
            text: null,
            error: "Failed to capture screen",
          } satisfies OCRResult);
        }
        return;
      }
    }

    const output = await engine.recognize(imagePath, { mode: "text" });
    const recognizedText = output.text;

    if (!recognizedText) {
      await showFailureToast("No text detected", { title: "No text detected" });

      if (callbackOptions) {
        await callbackLaunchCommand(callbackOptions, {
          text: null,
          latex: output.latex,
          error: "No text detected",
        } satisfies OCRResult);
      }

      return;
    }

    if (callbackOptions) {
      await callbackLaunchCommand(callbackOptions, {
        text: recognizedText,
        latex: output.latex,
      } satisfies OCRResult);
      return;
    }

    await Clipboard.copy(recognizedText);
    await showSuccessToast("Copied text to clipboard");
  } catch (e) {
    console.error(e);
    const errorMessage =
      e instanceof Error ? e.message : "Failed detecting text";
    await showFailureToast(e, { title: errorMessage });

    if (callbackOptions) {
      await callbackLaunchCommand(callbackOptions, {
        text: null,
        error: errorMessage,
      } satisfies OCRResult);
    }
  } finally {
    if (imagePath && engine.slug !== "visionkit") {
      await cleanupImageSwift(imagePath);
    }
  }
}
