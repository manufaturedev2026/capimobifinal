import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { handleVitePreloadError } from "@/lib/chunkRecovery";
import { initPwaInstall } from "@/lib/pwaInstall";

handleVitePreloadError();
initPwaInstall();

createRoot(document.getElementById("root")!).render(<App />);
