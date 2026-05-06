export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type PwaInstallGuideMode = "ios" | "manual" | "preview";
export type PwaInstallOutcome = "accepted" | "dismissed" | "unavailable";

export interface PwaInstallSnapshot {
  canPrompt: boolean;
  guideMode: PwaInstallGuideMode;
  installed: boolean;
  isIOS: boolean;
  isPreview: boolean;
}

type Listener = (snapshot: PwaInstallSnapshot) => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
let installed = false;
let relatedAppInstalled = false;

const listeners = new Set<Listener>();

function isInIframe() {
  if (typeof window === "undefined") return false;

  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isPreviewHost() {
  if (typeof window === "undefined") return false;

  const { hostname } = window.location;
  return hostname.includes("id-preview--") || hostname.includes("lovableproject.com");
}

export function detectIOS() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const isTouchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return /iphone|ipad|ipod/.test(userAgent) || isTouchMac;
}

export function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isAppInstalled() {
  return isStandaloneDisplayMode() || relatedAppInstalled;
}

export function isIOSStandaloneApp() {
  return detectIOS() && isStandaloneDisplayMode();
}

function buildSnapshot(): PwaInstallSnapshot {
  const nextInstalled = installed || isAppInstalled();
  installed = nextInstalled;

  const isIOS = detectIOS();
  const isPreview = isInIframe() || isPreviewHost();

  return {
    canPrompt: Boolean(deferredPrompt),
    guideMode: isIOS ? "ios" : isPreview ? "preview" : "manual",
    installed: nextInstalled,
    isIOS,
    isPreview,
  };
}

function emitSnapshot() {
  const snapshot = buildSnapshot();
  listeners.forEach((listener) => listener(snapshot));
}

function handleBeforeInstallPrompt(event: Event) {
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  emitSnapshot();
}

function handleAppInstalled() {
  installed = true;
  deferredPrompt = null;
  try {
    localStorage.setItem("pwa:installed", "1");
  } catch {
    /* ignore */
  }
  emitSnapshot();
}

function syncInstallState() {
  emitSnapshot();
}

export function initPwaInstall() {
  if (typeof window === "undefined" || initialized) return;

  initialized = true;
  try {
    if (localStorage.getItem("pwa:installed") === "1") {
      installed = true;
    }
  } catch {
    /* ignore */
  }
  installed = installed || isAppInstalled();

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
  window.addEventListener("appinstalled", handleAppInstalled);
  window.addEventListener("focus", syncInstallState);
  document.addEventListener("visibilitychange", syncInstallState);

  // Detect already-installed PWA via getInstalledRelatedApps (Chrome Android).
  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<Array<{ platform: string; url?: string; id?: string }>>;
  };
  if (typeof nav.getInstalledRelatedApps === "function") {
    nav.getInstalledRelatedApps()
      .then((apps) => {
        if (apps && apps.length > 0) {
          relatedAppInstalled = true;
          installed = true;
          try {
            localStorage.setItem("pwa:installed", "1");
          } catch {
            /* ignore */
          }
          emitSnapshot();
        }
      })
      .catch(() => {
        /* ignore */
      });
  }
}

export function getPwaInstallSnapshot() {
  initPwaInstall();
  return buildSnapshot();
}

export function subscribePwaInstall(listener: Listener) {
  initPwaInstall();
  listeners.add(listener);
  listener(buildSnapshot());

  return () => {
    listeners.delete(listener);
  };
}

export async function requestPwaInstall(): Promise<{ outcome: PwaInstallOutcome }> {
  initPwaInstall();

  if (!deferredPrompt) {
    return { outcome: "unavailable" };
  }

  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  emitSnapshot();

  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    if (choice.outcome === "accepted") {
      installed = true;
    }

    emitSnapshot();
    return choice;
  } catch {
    emitSnapshot();
    return { outcome: "unavailable" };
  }
}