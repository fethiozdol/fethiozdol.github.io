// Article feature and privacy assertions against the generated site. Run `npm run build` first.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { listFiles, resourceUrls } from './helpers.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const files = existsSync(dist) ? listFiles(dist) : [];
const pages = files.filter((file) => file.endsWith('.html'));
const article = () => readFileSync(join(dist, 'blog/2024/ht-startup-w-devops-p01/index.html'), 'utf8');

test('dist exists', () => assert.ok(pages.length > 0, 'run npm run build before npm test'));

test('article keeps both gallery images with alt text', () => {
  const html = article();
  for (const n of ['01', '02']) {
    const src = `/assets/img/2024-07-01-how-to-startup-with-devops-part-1/diagram-${n}.png`;
    assert.match(html, new RegExp(`<img[^>]*src="${src}"[^>]*alt="[^"]+"`), `diagram-${n} image with alt`);
    assert.match(html, new RegExp(`<a[^>]*href="${src}"`), `diagram-${n} full-size link`);
  }
  assert.match(html, /class="article-gallery"/);
  assert.match(html, /Swipe left to see how our pipelines work in our hybrid solution\./);
});

test('article keeps Mermaid diagram sources as a readable fallback', () => {
  assert.equal(article().match(/<code class="language-mermaid">/g)?.length, 3);
});

test('no raw Liquid survives in generated pages', () => {
  for (const page of pages) {
    const markup = readFileSync(page, 'utf8').replace(/<(style|script)\b[\s\S]*?<\/\1>/g, '');
    assert.doesNotMatch(markup, /\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/, page);
  }
});

test('no analytics, tag manager or consent banner code is published', () => {
  const tracking = /googletagmanager\.com|google-analytics\.com|gtag\(|G-BFVSGSW9BJ|GTM-WRRMQF2G|cookieconsent|osano/i;
  for (const file of files.filter((f) => /\.(html|js|css|xml)$/.test(f))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), tracking, file);
  }
});

const SITE = 'https://thisismypattern.com';
const isOwnResource = (url) => {
  if (/^data:/i.test(url)) return true;
  try {
    return new URL(url, `${SITE}/page/`).origin === SITE;
  } catch {
    return false;
  }
};

test('resource detection catches third-party loads in any attribute order or CSS', () => {
  const thirdParty = (markup, options) => resourceUrls(markup, options).filter((url) => !isOwnResource(url));
  for (const markup of [
    '<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">',
    '<link rel=preconnect href=https://fonts.gstatic.com>',
    '<video poster="https://cdn.example/p.jpg"><source src="https://cdn.example/v.mp4"></video>',
    '<img src="/a.png" srcset="/a-480.webp 480w, https://cdn.example/a.webp 800w">',
    '<style>@import url("https://cdn.example/a.css");</style>',
    '<style>@import "https://cdn.example/b.css";</style>',
    '<div style="background:url(//cdn.example/bg.png)"></div>',
    '<script src="https://cdn.example/x.js"></script>',
  ]) {
    assert.ok(thirdParty(markup).length > 0, markup);
  }
  assert.equal(thirdParty('body{background:url(https://cdn.example/bg.png)}', { css: true }).length, 1);
  assert.deepEqual(
    thirdParty('<a href="https://github.com/x">x</a><link rel="canonical" href="https://elsewhere.example/"><img src="data:image/png;base64,AA">'),
    [],
  );
});

test('pages and stylesheets load resources only from this site', () => {
  for (const file of files.filter((f) => /\.(html|css)$/.test(f))) {
    const markup = readFileSync(file, 'utf8');
    for (const url of resourceUrls(markup, { css: file.endsWith('.css') })) assert.ok(isOwnResource(url), `${file}: ${url}`);
    if (file.endsWith('.html')) assert.doesNotMatch(markup, /<iframe/i, file);
  }
});

test('comments are reachable without loading a third-party embed', () => {
  const html = article();
  assert.match(html, /href="https:\/\/github\.com\/fethiozdol\/fethiozdol\.github\.io\/discussions"/);
  assert.doesNotMatch(html, /giscus\.app\/client\.js/);
});

test('policy pages describe the site without analytics and keep their history', () => {
  for (const path of ['terms/index.html', 'cookies/index.html']) {
    const html = readFileSync(join(dist, path), 'utf8');
    assert.match(html, /does not use analytics/i, path);
    assert.match(html, /Version history/i, path);
    assert.match(html, /03 July 2024/, path);
  }
});
