import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import postsPlugin from "./plugins/vite-plugin-posts.mjs";

function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id: string) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "");
        return path.resolve(__dirname, "src/assets", filename);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    postsPlugin({ repoRoot: __dirname }),
    // Use OXC plugin for better performance and Vite 8 compatibility
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        blog: path.resolve(__dirname, "blog.html"),
      },
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // Match on package directory boundaries. The previous version used
          // bare `id.includes('react')`, which swallowed every package with
          // "react" anywhere in its path (react-i18next, ogl's paths, ...)
          // into `vendor-ui` before the later `ogl` branch could ever run.
          const match = id.match(/node_modules\/(?:\.pnpm\/)?(?:([^@/]+)|(@[^/]+\/[^/]+))/);
          const pkg = match?.[2] ?? match?.[1] ?? "";

          if (pkg === "ogl") return "webgl-libs";
          if (pkg === "motion" || pkg === "framer-motion" || pkg === "motion-dom" || pkg === "motion-utils")
            return "motion";
          if (pkg === "lucide-react") return "lucide-react";
          if (pkg.startsWith("i18next") || pkg === "react-i18next") return "i18n";
          if (pkg === "react" || pkg === "react-dom" || pkg === "scheduler") return "react";

          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"],
});
