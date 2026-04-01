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

function detectIOS() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const isTouchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return /iphone|ipad|ipod/.test(userAgent) || isTouchMac;
}

export function isAppInstalled() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
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
  emitSnapshot();
}

function syncInstallState() {
  emitSnapshot();
}

export function initPwaInstall() {
  if (typeof window === "undefined" || initialized) return;

  initialized = true;
  installed = isAppInstalled();

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
  window.addEventListener("appinstalled", handleAppInstalled);
  window.addEventListener("focus", syncInstallState);
  document.addEventListener("visibilitychange", syncInstallState);
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