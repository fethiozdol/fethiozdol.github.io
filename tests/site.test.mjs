// Assertions against the generated site. Run `npm run build` first.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { routeToFile } from '../scripts/check-site.mjs';
import { listFiles, readPagefindPages } from './helpers.mjs';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const distDir = fileURLToPath(dist);
const ORIGIN = 'https://thisismypattern.com';
const ARTICLE = '/blog/2024/ht-startup-w-devops-p01/';
const read = (path) => {
  const file = new URL(path, dist);
  assert.ok(existsSync(file), `dist/${path} is missing; run npm run build before npm test`);
  return readFileSync(file, 'utf8');
};
const resume = JSON.parse(readFileSync(new URL('assets/json/resume.json', root), 'utf8'));
const decode = (html) =>
  html
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"');

test('CV renders every populated résumé section with real entries', () => {
  const cv = decode(read('cv/index.html'));
  const expected = {
    basics: 'Profile',
    work: 'Experience',
    education: 'Education',
    projects: 'Projects',
    awards: 'Awards',
    certificates: 'Certificates',
    publications: 'Publications',
    skills: 'Skills',
    languages: 'Languages',
    interests: 'Interests',
  };
  for (const [key, heading] of Object.entries(expected)) {
    assert.match(cv, new RegExp(`<h2[^>]*id="${key}"[^>]*>${heading}</h2>`), `missing ${heading} heading`);
  }
  assert.ok(cv.includes(resume.basics.summary));
  assert.ok(cv.includes(resume.basics.nationality));
  assert.ok(cv.includes(resume.work.at(-1).summary), 'oldest work entry');
  assert.ok(cv.includes(resume.education[0].institution));
  assert.ok(cv.includes(resume.projects[0].name));
  assert.ok(cv.includes(resume.awards[0].title));
  assert.ok(cv.includes(resume.certificates[0].name));
  assert.ok(cv.includes(resume.publications[0].name));
  assert.ok(cv.includes(resume.skills[0].keywords[0]));
  assert.ok(cv.includes(resume.languages[0].language));
  assert.ok(cv.includes(resume.interests[0].keywords[0]));
});

test('CV shows ongoing roles as Present and hides empty sections', () => {
  const cv = read('cv/index.html');
  const ongoing = resume.work.find((job) => !job.endDate);
  assert.ok(ongoing, 'fixture expects at least one ongoing role');
  const entry = cv.slice(cv.indexOf(ongoing.position));
  assert.match(entry, /<p class="cv-when">[\s\S]*?Present/);
  for (const empty of ['volunteer', 'references', 'sideProjects', 'meta']) {
    assert.doesNotMatch(cv, new RegExp(`id="${empty}"`), `${empty} should not render`);
  }
});

test('CV does not expose fields the old site hid', () => {
  const cv = read('cv/index.html');
  const text = cv.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
  assert.doesNotMatch(text, new RegExp(`\\b${resume.basics.location.postalCode}\\b`), 'postal code');
  assert.match(text, /London, UK/);
  assert.doesNotMatch(cv, /\$schema|jsoncv\.schema/);
});

test('CV links to the PDF download and GitHub profile', () => {
  const cv = read('cv/index.html');
  assert.match(cv, /href="\/assets\/pdf\/cv\.pdf"/);
  assert.match(read('repositories/index.html'), /href="https:\/\/github\.com\/fethiozdol"/);
});

test('PDF and résumé JSON are published byte-for-byte', () => {
  for (const path of ['assets/pdf/cv.pdf', 'assets/json/resume.json']) {
    const built = new URL(path, dist);
    assert.ok(existsSync(built), `dist/${path} missing`);
    assert.deepEqual(readFileSync(built), readFileSync(new URL(path, root)), path);
  }
});

test('home page uses the existing biography, article and announcements', () => {
  const home = decode(read('index.html'));
  assert.ok(home.includes('I’m Fethi, a London-based cloud architect'));
  assert.ok(home.includes('classical guitar'));
  assert.match(home, /href="\/blog\/2024\/ht-startup-w-devops-p01\/"/);
  assert.match(home, /Joined Vehicularis Ltd/);
  assert.match(home, /src="\/assets\/img\/prof_pic\.webp"/);
});

test('404 page has working navigation', () => {
  const notFound = read('404.html');
  assert.match(notFound, /Page not found/);
  assert.match(notFound, /href="\/"/);
  assert.match(notFound, /href="\/blog\/"/);
});

test('Atom feed keeps its URL, entry identity, full content and escaping', () => {
  const feed = read('feed.xml');
  assert.match(feed, /^<\?xml version="1\.0" encoding="utf-8"\?>\s*<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/);
  assert.ok(feed.includes(`<link href="${ORIGIN}/feed.xml" rel="self" type="application/atom+xml"/>`));
  assert.ok(feed.includes(`<link href="${ORIGIN}${ARTICLE}" rel="alternate" type="text/html"`));
  assert.ok(feed.includes(`<id>${ORIGIN}${ARTICLE.replace(/\/$/, '')}</id>`), 'entry id matches the Jekyll feed');
  assert.ok(feed.includes('<subtitle>Hi, I&apos;m Fethi.'), 'apostrophes are escaped');
  assert.ok(feed.includes('Workload Infrastructure Base'), 'full article content');
  const outsideCdata = feed.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  assert.doesNotMatch(outsideCdata, /&(?!(?:amp|lt|gt|quot|apos);)/, 'bare ampersand outside CDATA');
});

test('sitemap lists every public page on the production domain', () => {
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  for (const loc of locs) {
    assert.ok(loc.startsWith(`${ORIGIN}/`), loc);
    assert.ok(existsSync(routeToFile(distDir, new URL(loc).pathname)), `${loc} has no generated page`);
  }
  const pages = listFiles(distDir)
    .filter((file) => file.endsWith('index.html'))
    .map((file) => `${ORIGIN}/${relative(distDir, file).replace(/index\.html$/, '')}`)
    .filter((url) => url !== `${ORIGIN}/search/`);
  assert.deepEqual([...locs].sort(), pages.sort());
});

test('home and article carry canonical, Open Graph and structured data', () => {
  const meta = (html, property) => new RegExp(`<meta property="${property}" content="([^"]*)"`).exec(html)?.[1];
  const jsonLd = (html) => JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? 'null');
  for (const [file, path, type] of [
    ['index.html', '/', 'website'],
    [`${ARTICLE.slice(1)}index.html`, ARTICLE, 'article'],
  ]) {
    const html = read(file);
    assert.ok(html.includes('<meta name="google-site-verification" content="5Lhp1lN5mNB84LS6y_8GsdoHcwSb29xxGr1LlOvbF5w">'), `${file} verification`);
    assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN}${path}">`), `${file} canonical`);
    assert.equal(meta(html, 'og:url'), `${ORIGIN}${path}`);
    assert.equal(meta(html, 'og:type'), type);
    assert.equal(meta(html, 'og:image'), `${ORIGIN}/assets/img/prof_pic.webp`);
    assert.ok(meta(html, 'og:title'), `${file} title`);
    assert.match(meta(html, 'og:description') ?? '', /^\S[^\n]*\S$/, `${file} description is a single trimmed line`);
  }
  const person = jsonLd(read('index.html'));
  assert.equal(person['@type'], 'Person');
  assert.equal(person.name, 'Fethi Ozdol');
  assert.ok(person.sameAs.includes('https://www.linkedin.com/in/mfethio'));
  const article = jsonLd(read(`${ARTICLE.slice(1)}index.html`));
  assert.equal(article['@type'], 'BlogPosting');
  assert.equal(article.headline, 'Kickstarting Your Startup with DevOps from Day Zero');
  assert.equal(article.datePublished.slice(0, 10), '2024-07-01');
  assert.equal(article.url, `${ORIGIN}${ARTICLE}`);
});

test('search indexes articles, announcements and the CV without repeated page chrome', () => {
  const pages = readPagefindPages(distDir);
  const urls = pages.map((page) => page.url);
  for (const url of [ARTICLE, '/cv/', '/news/announcement_01/']) assert.ok(urls.includes(url), `${url} indexed`);
  for (const url of ['/blog/', '/blog/2024/', '/blog/tag/aws/', '/news/', '/search/']) assert.ok(!urls.includes(url), `${url} not indexed`);
  const article = pages.find((page) => page.url === ARTICLE);
  assert.match(article.content, /Workload Infrastructure Base/);
  assert.doesNotMatch(article.content, /Skip to content|Download CV|Discuss on GitHub/);
});

test('horizontally scrolling tables can be reached and named by keyboard users', () => {
  for (const file of ['terms/index.html', 'cookies/index.html']) {
    const wrappers = read(file).match(/<div class="table-scroll"[^>]*>/g) ?? [];
    assert.ok(wrappers.length > 0, file);
    for (const wrapper of wrappers) {
      for (const attribute of [/tabindex="0"/, /role="region"/, /aria-labelledby="[^"]+"/]) assert.match(wrapper, attribute, `${file}: ${wrapper}`);
    }
  }
});

test('search UI loads only on the search page', () => {
  for (const file of listFiles(distDir).filter((f) => f.endsWith('.html') && !f.endsWith('/search/index.html'))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /\/pagefind\//, file);
  }
  assert.match(read('search/index.html'), /<script[^>]*src="\/pagefind\/pagefind-component-ui\.js"/);
  assert.match(read('index.html'), /href="\/search\/"/);
});
