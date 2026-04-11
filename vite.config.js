import { defineConfig } from 'vite';

export default defineConfig({
  base: '/14to17/',
  // Disable esbuild entirely — works around a Windows-specific issue where
  // Node.js libuv file writes produce compressed bytes (0x887d header) that
  // esbuild (Go binary) cannot read back. Rollup handles bundling in-memory.
  // Re-enable when the root cause is fixed (or build via CI on Linux).
  esbuild: false,
  build: {
    outDir: 'dist',
    minify: false,
    target: 'es2020',
  },
});
