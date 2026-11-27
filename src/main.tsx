import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./app/i18n/config";

// The static hero shell in index.html paints first, on its own: when the
// scripts arrive before the first frame (a fast connection, a warm cache),
// mounting at once would hold that frame until React had built the page,
// and the name and the photo would wait on the JavaScript. Two frames later
// the shell is on screen, and React takes over from it.
const mount = () => {
  // The shell has been animating since it painted; the nodes React is about
  // to mount continue from that point (Hero.css).
  const shellT0 = (window as { __heroT0?: number }).__heroT0;
  if (shellT0 != null) {
    document.documentElement.style.setProperty("--hero-elapsed", `${((performance.now() - shellT0) / 1000).toFixed(3)}s`);
  }
  createRoot(document.getElementById("root")!).render(<App />);
};

if (document.getElementById("root")?.firstElementChild) requestAnimationFrame(() => setTimeout(mount, 0));
else mount();
