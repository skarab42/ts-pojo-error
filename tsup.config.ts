import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  outDir: "dist",
  splitting: true,
  sourcemap: true,
  platform: "node",
  minify: true,
  clean: true,
  dts: true,
});
