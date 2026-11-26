import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./app/i18n/config";

// The static hero shell in index.html has been animating since it painted;
// the nodes React is about to mount continue from that point (Hero.css).
const shellT0 = (window as { __heroT0?: number }).__heroT0;
if (shellT0 != null) {
  document.documentElement.style.setProperty("--hero-elapsed", `${((performance.now() - shellT0) / 1000).toFixed(3)}s`);
}

createRoot(document.getElementById("root")!).render(<App />);
