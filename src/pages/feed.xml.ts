import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { getPublishedPosts } from '../lib/content';
import { atomFeed } from '../lib/xml';

export const GET: APIRoute = async ({ site: siteUrl }) => {
  const posts = await getPublishedPosts();
  const body = atomFeed({
    site: siteUrl!,
    title: site.title,
    subtitle: site.description,
    author: site.author,
    entries: posts.map((post) => ({
      title: post.data.title,
      permalink: post.data.permalink,
      date: post.data.date,
      summary: post.data.description,
      tags: post.data.tags,
      html: post.rendered?.html ?? '',
    })),
  });
  return new Response(body, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
};
