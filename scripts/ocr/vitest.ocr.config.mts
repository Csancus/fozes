import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Story 10.1 – OCR-mérés (nem része az `npm test`-nek, mert valódi tesseractot
// futtat és letölti a nyelvi adatot). Futtatás:
//   npx vitest run --config scripts/ocr/vitest.ocr.config.mts
//   OCR_STAGE=baseline npx vitest run --config scripts/ocr/vitest.ocr.config.mts
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["scripts/ocr/**/*.bench.ts"],
    testTimeout: 600_000,
    hookTimeout: 120_000,
  },
});
