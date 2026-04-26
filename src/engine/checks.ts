import { OCREngine, EngineStatus } from "./interface";
import { getAvailableEngines, resolveEngine } from "./registry";

export async function validateEngineSetup(
  engine: OCREngine,
): Promise<EngineStatus> {
  try {
    return await engine.checkPrerequisites();
  } catch (error) {
    return {
      ready: false,
      message: `Error checking engine: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function getAllEngineStatuses(): Promise<
  Array<{ slug: string; displayName: string; status: EngineStatus }>
> {
  const slugs = getAvailableEngines();
  const results = await Promise.allSettled(
    slugs.map(async (slug) => {
      try {
        const engine = resolveEngine(slug);
        const status = await engine.checkPrerequisites();
        return {
          slug: engine.slug,
          displayName: engine.displayName,
          status,
        };
      } catch (error) {
        return {
          slug,
          displayName: slug,
          status: {
            ready: false,
            message: `Engine not available: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        };
      }
    }),
  );

  return results
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<{
        slug: string;
        displayName: string;
        status: EngineStatus;
      }> => result.status === "fulfilled",
    )
    .map((result) => result.value);
}
