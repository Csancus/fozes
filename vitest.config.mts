import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Egyszerű unit-teszt beállítás: Node környezet, a Redis memóriában fut
// (tests/support/fake-redis.ts), külső szolgáltatás nem kell.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/support/setup.ts"],
  },
});
