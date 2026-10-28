export function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function cdata(text: string): string {
  return `<![CDATA[${text.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
}

export interface FeedEntry {
  title: string;
  permalink: string;
  date: Date;
  summary?: string;
  tags: string[];
  html: string;
}

interface Feed {
  site: URL;
  title: string;
  subtitle: string;
  author: string;
  entries: FeedEntry[];
}

/** Atom, as the Jekyll feed was. Entry ids keep Jekyll's form (no trailing slash) so readers don't show duplicates. */
export function atomFeed({ site, title, subtitle, author, entries }: Feed): string {
  const href = (path: string) => escapeXml(new URL(path, site).href);
  const updated = (entries[0]?.date ?? new Date()).toISOString();
  const items = entries.map((entry) => {
    const url = href(entry.permalink);
    return [
      '<entry>',
      `<title type="html">${escapeXml(entry.title)}</title>`,
      `<link href="${url}" rel="alternate" type="text/html" title="${escapeXml(entry.title)}"/>`,
      `<published>${entry.date.toISOString()}</published>`,
      `<updated>${entry.date.toISOString()}</updated>`,
      `<id>${href(entry.permalink.replace(/\/$/, ''))}</id>`,
      `<author><name>${escapeXml(author)}</name></author>`,
      ...entry.tags.map((tag) => `<category term="${escapeXml(tag)}"/>`),
      entry.summary ? `<summary type="html">${escapeXml(entry.summary)}</summary>` : '',
      `<content type="html" xml:base="${url}">${cdata(entry.html)}</content>`,
      '</entry>',
    ].join('');
  });
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">',
    `<link href="${href('/feed.xml')}" rel="self" type="application/atom+xml"/>`,
    `<link href="${href('/')}" rel="alternate" type="text/html" hreflang="en"/>`,
    `<updated>${updated}</updated>`,
    `<id>${href('/feed.xml')}</id>`,
    `<title type="html">${escapeXml(title)}</title>`,
    `<subtitle>${escapeXml(subtitle)}</subtitle>`,
    `<author><name>${escapeXml(author)}</name></author>`,
    ...items,
    '</feed>',
    '',
  ].join('\n');
}

export function sitemapXml(site: URL, pages: { path: string; lastmod?: Date }[]): string {
  const urls = pages.map(
    ({ path, lastmod }) =>
      `<url><loc>${escapeXml(new URL(path, site).href)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : ''}</url>`,
  );
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join(
    '\n',
  );
}
