import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      composite: false,
      incremental: false,
    }
  },
  clean: true,
  sourcemap: false,
  splitting: false,
  outDir: 'dist',
  shims: true,
  tsconfig: 'tsconfig.build.json',
  noExternal: ['@cumberstorm/reporting'],
});
