import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { PUBLIC_ASSET_DIRS } from './scripts/copy-assets.mjs';

const contentTypes = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
};

/** Serves the assets that scripts/copy-assets.mjs copies after a build, so `astro dev` shows them too. */
function devAssets() {
  return {
    name: 'dev-assets',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          // Keep the pathname percent-encoded until fileURLToPath, so an encoded #, ? or % stays part of the file name.
          const { pathname } = new URL(req.url ?? '/', 'http://localhost');
          const match = /^\/assets\/([^/]+)\/.+$/.exec(pathname);
          if (!match || !PUBLIC_ASSET_DIRS.includes(match[1])) return next();
          let file;
          try {
            file = fileURLToPath(new URL(`.${pathname}`, import.meta.url));
          } catch {
            return next();
          }
          const dir = fileURLToPath(new URL(`./assets/${match[1]}/`, import.meta.url));
          if (!file.startsWith(dir) || !existsSync(file) || !statSync(file).isFile()) return next();
          res.setHeader('Content-Type', contentTypes[extname(file).toLowerCase()] ?? 'application/octet-stream');
          createReadStream(file).pipe(res);
        });
      },
    },
  };
}

export default defineConfig({
  site: 'https://thisismypattern.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    format: 'directory',
  },
  integrations: [devAssets()],
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['math', 'mermaid'],
    },
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      // Emit both themes as --shiki-* variables only; global.css picks one per colour scheme.
      defaultColor: false,
    },
  },
  vite: {
    build: {
      // Mermaid's optional diagram modules (loaded only when a diagram needs them) exceed the 500 kB default.
      chunkSizeWarningLimit: 700,
    },
  },
});
