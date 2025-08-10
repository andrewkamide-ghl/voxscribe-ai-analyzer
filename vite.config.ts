import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Make lovable-tagger optional in dev to avoid preview crashes when it's unavailable
export default defineConfig(async ({ mode }) => {
  let tagger: any = null;

  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      tagger = componentTagger();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[vite] lovable-tagger unavailable in this environment. Continuing without it.");
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), tagger].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
  };
});
