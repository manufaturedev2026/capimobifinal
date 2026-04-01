import { lazy, type ComponentType } from "react";

const CHUNK_RETRY_KEY = "brokersbio-chunk-retry";

export function lazyPage<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const module = await importer();

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(CHUNK_RETRY_KEY);
      }

      return module;
    } catch (error) {
      if (typeof window !== "undefined") {
        const hasRetried = window.sessionStorage.getItem(CHUNK_RETRY_KEY) === "true";

        if (!hasRetried) {
          window.sessionStorage.setItem(CHUNK_RETRY_KEY, "true");
          window.location.reload();
          return new Promise<never>(() => {});
        }

        window.sessionStorage.removeItem(CHUNK_RETRY_KEY);
      }

      throw error;
    }
  });
}

export function handleVitePreloadError() {
  if (typeof window === "undefined") return;

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();

    const hasRetried = window.sessionStorage.getItem(CHUNK_RETRY_KEY) === "true";

    if (hasRetried) {
      window.sessionStorage.removeItem(CHUNK_RETRY_KEY);
      return;
    }

    window.sessionStorage.setItem(CHUNK_RETRY_KEY, "true");
    window.location.reload();
  });
}

export function clearChunkRetryFlag() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(CHUNK_RETRY_KEY);
  }
}