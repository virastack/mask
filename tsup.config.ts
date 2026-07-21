import { defineConfig } from 'tsup';
import fs from 'fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react-hook-form'],
  async onSuccess() {
    const files = ['dist/index.js', 'dist/index.mjs'];
    for (const file of files) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        fs.writeFileSync(file, '"use client";\n' + content);
      }
    }
  },
});
