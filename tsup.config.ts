import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: {
    banner: 'import "zustand/middleware";',
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "zustand"],
  treeshake: true,
  minify: false,
});
