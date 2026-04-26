const ALLOWED_HOSTNAMES = ["localhost", "127.0.0.1", "::1"];

const BLOCKED_PREFIXES = [
  "169.254.",
  "10.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
  "192.168.",
  "0.",
  "100.64.",
  "127.",
];

export function isSafeOllamaEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    if (ALLOWED_HOSTNAMES.includes(hostname)) {
      return true;
    }

    for (const prefix of BLOCKED_PREFIXES) {
      if (hostname.startsWith(prefix)) {
        return false;
      }
    }

    return false;
  } catch {
    return false;
  }
}
