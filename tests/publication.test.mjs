// Builds a disposable copy of the site with a draft and a future-dated post, then checks neither leaks anywhere.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ASSET_DIRS } from '../scripts/copy-assets.mjs';
import { listFiles, readPagefindPages } from './helpers.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const BUILD_INPUTS = [
  'src',
  '_posts',
  '_news',
  'public',
  'scripts',
  'astro.config.mjs',
  'package.json',
  'tsconfig.json',
  ...PUBLIC_ASSET_DIRS.map((dir) => `assets/${dir}`),
];
const MARKER = 'unpublishedfixturemarker';
const CV_MARKER = 'unlistedresumesectionmarker';
const fixture = ({ date, year, slug, frontmatter = '' }) => `---
title: ${MARKER} ${slug}
date: ${date}
description: ${MARKER} description
tags: [${MARKER}-tag]
categories: [${MARKER}-category]
permalink: /blog/${year}/${slug}/
${frontmatter}---

${MARKER} body text with an image ![${MARKER}](/assets/img/${MARKER}.png).
`;

let checkout;
let dist;

before(() => {
  mkdirSync(join(root, '.tmp'), { recursive: true });
  checkout = mkdtempSync(join(root, '.tmp', 'publication-'));
  for (const input of BUILD_INPUTS) cpSync(join(root, input), join(checkout, input), { recursive: true });
  writeFileSync(
    join(checkout, '_posts/2023-05-01-draft-fixture.md'),
    fixture({ date: '2023-05-01', year: 2023, slug: 'draft-fixture', frontmatter: 'draft: true\n' }),
  );
  writeFileSync(
    join(checkout, '_posts/2022-03-01-unpublished-fixture.md'),
    fixture({ date: '2022-03-01', year: 2022, slug: 'unpublished-fixture', frontmatter: 'published: false\n' }),
  );
  writeFileSync(join(checkout, '_posts/2999-01-01-future-fixture.md'), fixture({ date: '2999-01-01', year: 2999, slug: 'future-fixture' }));
  writeFileSync(
    join(checkout, '_posts/2021-02-01-code-fixture.md'),
    '---\ntitle: Code fixture\ndate: 2021-02-01\npermalink: /blog/2021/code-fixture/\n---\n\n```js\nconst answer = 42;\n```\n',
  );
  const resumePath = join(checkout, 'assets/json/resume.json');
  const resume = JSON.parse(readFileSync(resumePath, 'utf8'));
  writeFileSync(resumePath, JSON.stringify({ ...resume, unlistedSection: [{ name: CV_MARKER, summary: CV_MARKER }] }));
  execFileSync('npm', ['run', 'build'], { cwd: checkout, stdio: 'pipe', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
  dist = join(checkout, 'dist');
});

after(() => {
  if (checkout) rmSync(checkout, { recursive: true, force: true });
});

test('unpublished posts leave no trace in any generated text file', () => {
  const textFiles = listFiles(dist).filter((file) => /\.(html|xml|txt|json|js|css)$/.test(file));
  assert.ok(
    textFiles.some((file) => file.endsWith('feed.xml')),
    'feed was generated',
  );
  for (const file of textFiles) assert.ok(!readFileSync(file, 'utf8').includes(MARKER), file);
});

test('unpublished posts create no pages or archives', () => {
  for (const path of [
    'blog/2023/draft-fixture',
    'blog/2022/unpublished-fixture',
    'blog/2999/future-fixture',
    'blog/2023',
    'blog/2022',
    'blog/2999',
    `blog/tag/${MARKER}-tag`,
    `blog/category/${MARKER}-category`,
  ]) {
    assert.ok(!existsSync(join(dist, path)), `${path} should not exist`);
  }
  assert.ok(existsSync(join(dist, 'blog/2024/ht-startup-w-devops-p01/index.html')), 'real article still builds');
});

test('search finds the real article and CV but not the fixtures', () => {
  const pages = readPagefindPages(dist);
  assert.ok(pages.some((page) => page.url === '/blog/2024/ht-startup-w-devops-p01/'));
  assert.ok(pages.some((page) => page.url === '/cv/'));
  for (const page of pages) assert.ok(!JSON.stringify(page).includes(MARKER) && !JSON.stringify(page).includes(CV_MARKER), page.url);
});

test('highlighted code carries both themes as variables so dark mode can switch them', () => {
  const html = readFileSync(join(dist, 'blog/2021/code-fixture/index.html'), 'utf8');
  const block = /<pre class="astro-code[^"]*"[\s\S]*?<\/pre>/.exec(html)?.[0];
  assert.ok(block, 'code block rendered');
  assert.match(block, /--shiki-dark:/);
  assert.doesNotMatch(block, /style="[^"]*(?<!-)color:/, 'no inline light colour that would override the dark theme');
});

test('résumé keys outside the CV allowlist are not rendered', () => {
  const cv = readFileSync(join(dist, 'cv/index.html'), 'utf8');
  assert.ok(cv.includes('Experience'), 'CV still renders');
  assert.ok(!cv.includes(CV_MARKER) && !/unlisted ?section/i.test(cv));
});
