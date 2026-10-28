import type { APIRoute } from 'astro';
import { buildBlogRoutes, getPublishedNews, getPublishedPosts } from '../lib/content';
import { sitemapXml } from '../lib/xml';

const STANDALONE_PAGES = ['/', '/cv/', '/repositories/', '/news/', '/terms/', '/cookies/'];

export const GET: APIRoute = async ({ site }) => {
  const [posts, news] = await Promise.all([getPublishedPosts(), getPublishedNews()]);
  const pages = [
    ...STANDALONE_PAGES.map((path) => ({ path })),
    ...[...buildBlogRoutes(posts)].map(([path, route]) => ({
      path: path ? `/blog/${path}/` : '/blog/',
      lastmod: route.kind === 'post' ? route.post.data.date : undefined,
    })),
    ...news.map((entry) => ({ path: entry.data.permalink, lastmod: entry.data.date })),
  ];
  return new Response(sitemapXml(site!, pages), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
