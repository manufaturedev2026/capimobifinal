import { useEffect, useState } from "react";

import {
  getPwaInstallSnapshot,
  requestPwaInstall,
  subscribePwaInstall,
  type PwaInstallSnapshot,
} from "@/lib/pwaInstall";

export function usePwaInstall() {
  const [snapshot, setSnapshot] = useState<PwaInstallSnapshot>(() => getPwaInstallSnapshot());

  useEffect(() => subscribePwaInstall(setSnapshot), []);

  return {
    ...snapshot,
    requestInstall: requestPwaInstall,
  };
}