#!/usr/bin/env node
// Usage: node scripts/check-site.mjs <output-dir> [baseline.json]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://thisismypattern.com';
const defaultBaseline = fileURLToPath(new URL('../tests/fixtures/legacy-site.json', import.meta.url));

export function routeToFile(root, pathname) {
  const decoded = pathname
    .split('/')
    .map((segment) => decodeURIComponent(segment))
    .join('/');
  const file = decoded.endsWith('/') ? `${decoded}index.html` : decoded;
  return join(root, ...file.split('/').filter(Boolean));
}

function fileToUrlPath(root, file) {
  const rel = relative(root, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractUrls(html) {
  const urls = [];
  const attr = /\s(href|src|srcset|poster)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const match of html.matchAll(attr)) {
    const raw = decodeEntities(match[2] ?? match[3] ?? '');
    if (match[1].toLowerCase() === 'srcset') {
      for (const candidate of raw.split(',')) {
        const url = candidate.trim().split(/\s+/)[0];
        if (url) urls.push(url);
      }
    } else {
      urls.push(raw);
    }
  }
  return urls;
}

const idCache = new Map();
function hasFragment(file, fragment) {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    const ids = new Set();
    for (const match of html.matchAll(/\s(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
      ids.add(decodeEntities(match[1] ?? match[2]));
    }
    idCache.set(file, ids);
  }
  return idCache.get(file).has(fragment);
}

export function checkSite(root, baseline) {
  const failures = [];
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    return [`Output directory does not exist: ${root}`];
  }

  for (const route of baseline.routes) {
    if (!existsSync(routeToFile(root, route))) failures.push(`Missing route ${route}`);
  }
  for (const asset of baseline.assets) {
    if (!existsSync(routeToFile(root, asset))) failures.push(`Missing asset ${asset}`);
  }
  // Without it GitHub Pages runs Jekyll over the output and drops the underscore-prefixed /_astro/ bundle.
  if (!existsSync(join(root, '.nojekyll'))) failures.push('Missing /.nojekyll');

  const htmlFiles = walk(root).filter((file) => file.endsWith('.html'));
  for (const file of htmlFiles) {
    const pageUrl = new URL(fileToUrlPath(root, file), SITE_ORIGIN);
    for (const raw of extractUrls(readFileSync(file, 'utf8'))) {
      if (!raw || /^(mailto|tel|javascript|data|blob):/i.test(raw)) continue;
      let target;
      try {
        target = new URL(raw, pageUrl);
      } catch {
        failures.push(`${pageUrl.pathname}: unparseable URL ${raw}`);
        continue;
      }
      if (target.origin !== SITE_ORIGIN) continue;
      const targetFile = routeToFile(root, target.pathname);
      if (!existsSync(targetFile) || statSync(targetFile).isDirectory()) {
        failures.push(`${pageUrl.pathname}: broken link ${raw}`);
        continue;
      }
      if (target.hash && targetFile.endsWith('.html')) {
        const fragment = decodeURIComponent(target.hash.slice(1));
        if (fragment && !hasFragment(targetFile, fragment)) {
          failures.push(`${pageUrl.pathname}: missing fragment ${raw}`);
        }
      }
    }
  }

  return [...new Set(failures)];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [root, baselinePath = defaultBaseline] = process.argv.slice(2);
  if (!root) {
    console.error('Usage: node scripts/check-site.mjs <output-dir> [baseline.json]');
    process.exit(2);
  }
  const failures = checkSite(root, JSON.parse(readFileSync(baselinePath, 'utf8')));
  if (failures.length) {
    console.error(`check-site: ${failures.length} problem(s) in ${root}`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(`check-site: ${root} matches the baseline and has no broken internal links`);
}
