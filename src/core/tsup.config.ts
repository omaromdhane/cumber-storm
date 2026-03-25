import { defineConfig } from 'tsup';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
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
  async onSuccess() {
    // Copy html-reporter-template from the staging folder into dist
    // The html-reporter vite build outputs to src/html-reporter-template/
  //   const src = path.resolve(__dirname, 'src/html-reporter-template');
  //   const dest = path.resolve(__dirname, 'dist/html-reporter-template');
  //   if (fs.existsSync(src)) {
  //     fs.cpSync(src, dest, { recursive: true });
  //     console.log('✓ html-reporter-template copied to dist/');
  //   } else {
  //     console.warn('⚠ html-reporter-template not found at', src, '- run html-reporter build first');
  //   }
  },
});
