import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    target: "vercel",          // 👈 tells TanStack Start to build for Vercel
    server: { entry: "server" },
  },
});
