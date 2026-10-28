#!/usr/bin/env node
// Copies public files from assets/ into dist/assets/ at the same paths. Theme scripts, styles and fonts stay out.
import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PUBLIC_ASSET_DIRS = ['img', 'pdf', 'json'];

const root = new URL('../', import.meta.url);

export function copyAssets(outDir = new URL('dist/', root)) {
  for (const dir of PUBLIC_ASSET_DIRS) {
    const source = new URL(`assets/${dir}/`, root);
    if (!existsSync(source)) throw new Error(`assets/${dir}/ is missing`);
    cpSync(source, new URL(`assets/${dir}/`, outDir), { recursive: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  copyAssets();
  console.log(`copy-assets: copied assets/{${PUBLIC_ASSET_DIRS.join(',')}} into dist/assets/`);
}
