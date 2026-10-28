import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildBlogRoutes, formatDate, isoDate, isPublished, slugify } from '../src/lib/content.ts';
import { cdata, escapeXml } from '../src/lib/xml.ts';

const now = new Date('2026-10-27T12:00:00Z');

test('drafts are not published', () => {
  assert.equal(isPublished({ draft: true, date: new Date('2024-07-01T00:00:00Z') }, now), false);
});

test('future-dated entries are not published', () => {
  assert.equal(isPublished({ date: new Date('2026-10-27T12:00:01Z') }, now), false);
});

test('an entry dated exactly now is published', () => {
  assert.equal(isPublished({ date: new Date(now) }, now), true);
});

test('Jekyll published: false is not published', () => {
  assert.equal(isPublished({ published: false, date: new Date('2024-07-01T00:00:00Z') }, now), false);
});

test('entries without a draft flag publish normally', () => {
  assert.equal(isPublished({ date: new Date('2024-07-01T00:00:00Z') }, now), true);
  assert.equal(isPublished({ draft: false, date: new Date('2024-07-01T00:00:00Z') }, now), true);
});

const post = (date: string, extra: Partial<{ tags: string[]; categories: string[]; permalink: string }> = {}) => ({
  data: {
    date: new Date(date),
    permalink: '/blog/2024/ht-startup-w-devops-p01/',
    tags: ['devops'],
    categories: ['startup'],
    ...extra,
  },
});

test('explicit permalinks and year archives do not move with date or time zone', () => {
  for (const date of ['2024-07-01T00:00:00Z', '2024-12-31T23:30:00-05:00', '2024-01-01T00:30:00+14:00']) {
    const routes = buildBlogRoutes([post(date)]);
    assert.ok(routes.has('2024/ht-startup-w-devops-p01'), date);
    assert.ok(routes.has('2024'), date);
    assert.equal([...routes.keys()].filter((path) => /^\d{4}$/.test(path)).length, 1, date);
  }
});

test('blog routes include index, pagination, tag and category archives', () => {
  const posts = Array.from({ length: 6 }, (_, i) => post(`2024-07-0${i + 1}T00:00:00Z`, { permalink: `/blog/2024/post-${i}/`, tags: ['AWS CDK'] }));
  const routes = buildBlogRoutes(posts);
  assert.ok(routes.has(''));
  assert.ok(routes.has('page/2'));
  assert.ok(!routes.has('page/1'));
  assert.ok(routes.has('tag/aws-cdk'));
  assert.ok(routes.has('category/startup'));
});

test('colliding permalinks are rejected', () => {
  assert.throws(() => buildBlogRoutes([post('2024-07-01T00:00:00Z'), post('2024-07-02T00:00:00Z')]), /collision/i);
});

test('distinct terms that share an archive slug are rejected', () => {
  assert.throws(() => buildBlogRoutes([post('2024-07-01T00:00:00Z', { tags: ['C#', 'C'] })]), /collision/i);
  assert.throws(() => buildBlogRoutes([post('2024-07-01T00:00:00Z', { categories: ['#'] })]), /slug/i);
});

test('terms differing only in case share one archive', () => {
  const routes = buildBlogRoutes([
    post('2024-07-01T00:00:00Z', { tags: ['AWS'] }),
    post('2024-07-02T00:00:00Z', { permalink: '/blog/2024/other/', tags: ['aws'] }),
  ]);
  const archive = routes.get('tag/aws');
  assert.equal(archive?.kind === 'archive' && archive.posts.length, 2);
});

test('slugify matches existing archive URLs', () => {
  assert.equal(slugify('aws-cdk'), 'aws-cdk');
  assert.equal(slugify('cloud architecture'), 'cloud-architecture');
  assert.equal(slugify('Day0'), 'day0');
});

test('XML text is escaped and CDATA cannot be closed early', () => {
  assert.equal(escapeXml(`<a href="x">Tom & Jerry's</a>`), '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;');
  assert.equal(cdata('a ]]> b'), '<![CDATA[a ]]]]><![CDATA[> b]]>');
});

test('dates display as written, since frontmatter times without an offset are read as UTC', () => {
  assert.equal(formatDate(new Date('2024-07-01T00:00:00Z')), '1 July 2024');
  assert.equal(formatDate(new Date('2024-07-01T00:00:00-04:00')), '1 July 2024');
  assert.equal(formatDate(new Date('2025-06-30T23:30:00Z')), '30 June 2025');
  assert.equal(isoDate(new Date('2025-06-30T23:30:00Z')), '2025-06-30');
});
