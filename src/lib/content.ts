import type { CollectionEntry } from 'astro:content';

export const POSTS_PER_PAGE = 5;
// YAML reads frontmatter times without an offset as UTC, so showing UTC keeps the calendar date as written.
const DISPLAY_TIME_ZONE = 'UTC';
// One cut-off for the whole build, so every page agrees on which entries are published.
const BUILD_TIME = new Date();

export function isPublished(data: { draft?: boolean; published?: boolean; date: Date }, now: Date): boolean {
  return data.draft !== true && data.published !== false && data.date.getTime() <= now.getTime();
}

// Drafts and future entries are visible in `astro dev` for previewing, never in a build.
async function getVisible<C extends 'posts' | 'news'>(collection: C, now: Date) {
  const { getCollection } = await import('astro:content');
  const entries = await getCollection(collection, (entry: CollectionEntry<C>) => (import.meta.env.DEV ? true : isPublished(entry.data, now)));
  return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function getPublishedPosts(now = BUILD_TIME): Promise<CollectionEntry<'posts'>[]> {
  return getVisible('posts', now);
}

export function getPublishedNews(now = BUILD_TIME): Promise<CollectionEntry<'news'>[]> {
  return getVisible('news', now);
}

export async function renderEntry(entry: CollectionEntry<'posts' | 'news'>) {
  const { render } = await import('astro:content');
  return render(entry);
}

export function slugify(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: DISPLAY_TIME_ZONE }).format(date);
}

export function isoDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: DISPLAY_TIME_ZONE }).format(date);
}

export function permalinkYear(permalink: string): string {
  const year = /^\/blog\/(\d{4})\//.exec(permalink)?.[1];
  if (!year) throw new Error(`Post permalink ${permalink} does not start with /blog/YYYY/`);
  return year;
}

interface RoutablePost {
  data: { permalink: string; tags: string[]; categories: string[] };
}

export type BlogRoute<P extends RoutablePost> =
  | { kind: 'index'; page: number; totalPages: number; posts: P[] }
  | { kind: 'archive'; type: 'year' | 'tag' | 'category'; term: string; posts: P[] }
  | { kind: 'post'; post: P };

/**
 * Maps every /blog/ path (without the /blog/ prefix or trailing slash) to what it renders.
 * Expects posts already filtered for publication and sorted newest first.
 */
export function buildBlogRoutes<P extends RoutablePost>(posts: P[], perPage = POSTS_PER_PAGE): Map<string, BlogRoute<P>> {
  const routes = new Map<string, BlogRoute<P>>();
  const add = (path: string, route: BlogRoute<P>) => {
    if (routes.has(path)) throw new Error(`Blog route collision at /blog/${path ? `${path}/` : ''}`);
    routes.set(path, route);
  };

  const totalPages = Math.max(1, Math.ceil(posts.length / perPage));
  for (let page = 1; page <= totalPages; page++) {
    const pagePosts = posts.slice((page - 1) * perPage, page * perPage);
    add(page === 1 ? '' : `page/${page}`, { kind: 'index', page, totalPages, posts: pagePosts });
  }

  const archives = new Map<string, { type: 'year' | 'tag' | 'category'; term: string; posts: P[] }>();
  const addToArchive = (type: 'year' | 'tag' | 'category', term: string, post: P) => {
    const slug = type === 'year' ? term : slugify(term);
    if (!slug) throw new Error(`The ${type} "${term}" has no usable URL slug`);
    const path = type === 'year' ? term : `${type}/${slug}`;
    const archive = archives.get(path) ?? { type, term, posts: [] };
    if (archive.term.toLowerCase() !== term.toLowerCase()) {
      throw new Error(`Blog route collision at /blog/${path}/: "${archive.term}" and "${term}"`);
    }
    if (!archive.posts.includes(post)) archive.posts.push(post);
    archives.set(path, archive);
  };

  for (const post of posts) {
    const path = post.data.permalink.replace(/^\/blog\//, '').replace(/\/$/, '');
    add(path, { kind: 'post', post });
    addToArchive('year', permalinkYear(post.data.permalink), post);
    for (const tag of post.data.tags) addToArchive('tag', tag, post);
    for (const category of post.data.categories) addToArchive('category', category, post);
  }

  for (const [path, archive] of archives) add(path, { kind: 'archive', ...archive });
  return routes;
}
