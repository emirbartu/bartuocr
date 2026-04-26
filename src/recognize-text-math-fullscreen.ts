import { Clipboard, closeMainWindow, getPreferenceValues } from "@raycast/api";
import { showSuccessToast, showFailureToast } from "./utils";
import { resolveEngineFromPreferences } from "./engine/factory";
import {
  captureImage as captureImageSwift,
  cleanupImage as cleanupImageSwift,
} from "swift:../swift";

export default async function command() {
  await closeMainWindow();

  const preference = getPreferenceValues<Preferences>();
  const engine = resolveEngineFromPreferences();

  if (!engine.capabilities.latex) {
    await showFailureToast(
      `${engine.displayName} does not support math/LaTeX output. Switch to an engine with LaTeX support.`,
      { title: "Engine not supported" },
    );
    return;
  }

  let imagePath = "";

  try {
    if (engine.slug !== "visionkit") {
      imagePath = await captureImageSwift(
        true,
        preference.keepImage,
        Boolean(preference.playSound),
      );

      if (!imagePath) {
        await showFailureToast("Failed to capture screen", {
          title: "Capture failed",
        });
        return;
      }
    }

    const output = await engine.recognize(imagePath, { mode: "math" });

    if (!output.text && !output.latex) {
      await showFailureToast("No math content detected", {
        title: "No math detected",
      });
      return;
    }

    const clipboardContent = [output.text, output.latex]
      .filter(Boolean)
      .join("\n\n");

    await Clipboard.copy(clipboardContent);
    await showSuccessToast("Copied math to clipboard");
  } catch (e) {
    console.error(e);
    const errorMessage =
      e instanceof Error ? e.message : "Failed detecting math";
    await showFailureToast(e, { title: errorMessage });
  } finally {
    if (imagePath && engine.slug !== "visionkit") {
      await cleanupImageSwift(imagePath);
    }
  }
}
