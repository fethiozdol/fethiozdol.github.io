import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const terms = z.array(z.string().min(1)).default([]);

const posts = defineCollection({
  loader: glob({ base: './_posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    description: z
      .string()
      .transform((text) => text.replace(/\s+/g, ' ').trim())
      .optional(),
    tags: terms,
    categories: terms,
    draft: z.boolean().default(false),
    published: z.boolean().default(true),
    giscus_comments: z.boolean().default(false),
    permalink: z.string().regex(/^\/blog\/\d{4}\/[a-z0-9][a-z0-9-]*\/$/, 'permalink must look like /blog/YYYY/my-post-slug/'),
  }),
});

const news = defineCollection({
  loader: glob({ base: './_news', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    tags: terms,
    draft: z.boolean().default(false),
    published: z.boolean().default(true),
    permalink: z.string().regex(/^\/news\/[A-Za-z0-9_-]+\/$/, 'permalink must look like /news/my-announcement/'),
  }),
});

export const collections = { posts, news };
