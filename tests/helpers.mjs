import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

export const listFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });

const RESOURCE_ATTRIBUTES = new Set(['src', 'srcset', 'poster', 'data', 'imagesrcset']);
const RESOURCE_LINK_RELS = /\b(stylesheet|preload|modulepreload|prefetch|preconnect|dns-prefetch|icon|apple-touch-icon|manifest)\b/i;

function cssUrls(css) {
  return [...css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)|@import\s+(['"])(.*?)\3/gi)].map((m) => m[2] ?? m[4]);
}

/** Every URL the browser would fetch on its own: element resources, resource links and CSS url()/@import. */
export function resourceUrls(markup, { css = false } = {}) {
  if (css) return cssUrls(markup);
  const urls = [];
  for (const [, body] of markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) urls.push(...cssUrls(body));
  const withoutScripts = markup.replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1>/gi, '<$1$2>');
  for (const [, tag, rawAttributes] of withoutScripts.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
    const attributes = Object.fromEntries(
      [...rawAttributes.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map((m) => [
        m[1].toLowerCase(),
        m[2] ?? m[3] ?? m[4] ?? '',
      ]),
    );
    for (const [name, value] of Object.entries(attributes)) {
      if (name === 'style') urls.push(...cssUrls(value));
      else if (RESOURCE_ATTRIBUTES.has(name))
        urls.push(...(name.endsWith('srcset') ? value.split(',').map((c) => c.trim().split(/\s+/)[0]) : [value]));
      else if (name === 'href' && tag.toLowerCase() === 'link' && RESOURCE_LINK_RELS.test(attributes.rel ?? '')) urls.push(value);
    }
  }
  return urls.filter(Boolean);
}

/** Decodes Pagefind's per-page fragments: the URL, metadata and indexed text of every searchable page. */
export function readPagefindPages(distDir) {
  const dir = join(distDir, 'pagefind', 'fragment');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.pf_fragment'))
    .map((name) =>
      JSON.parse(
        gunzipSync(readFileSync(join(dir, name)))
          .toString('utf8')
          .replace(/^pagefind_dcd/, ''),
      ),
    );
}
