import { homedir } from "os";
import { access, constants } from "fs/promises";
import { execFile, ExecFileOptions } from "child_process";
import { promisify } from "util";

const execFileRaw = promisify(execFile);

const SEARCH_PATHS = [
  `${homedir()}/.local/bin`,
  `${homedir()}/.cargo/bin`,
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
];

const SAFE_PATH = [
  `${homedir()}/.local/bin`,
  `${homedir()}/.cargo/bin`,
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
  "/usr/sbin",
  "/sbin",
].join(":");

export async function resolveBinary(name: string): Promise<string | null> {
  for (const dir of SEARCH_PATHS) {
    const fullPath = `${dir}/${name}`;
    const exists = await access(fullPath, constants.X_OK)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      return fullPath;
    }
  }
  return null;
}

export async function execFileAsync(
  file: string,
  args: string[],
  options?: ExecFileOptions,
): Promise<{ stdout: string; stderr: string }> {
  return execFileRaw(file, args, {
    timeout: 60000,
    ...options,
    env: { ...process.env, PATH: SAFE_PATH, ...options?.env },
  });
}
