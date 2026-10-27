# This is My Pattern

Source for [thisismypattern.com](https://thisismypattern.com), the personal site and blog of Fethi Ozdol. It is a static [Astro](https://astro.build) site: every page is built ahead of time from the Markdown and JSON in this repository and published to GitHub Pages. There is no server, database, CMS or analytics.

## Local setup

You need Node.js 24 (the version is pinned in `.nvmrc`).

```sh
nvm use
npm ci
npm run dev       # http://localhost:4321, drafts and future posts included
```

| Command                            | What it does                                                         |
| ---------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                      | Development server with live reload. Search is not available here.   |
| `npm run build`                    | Builds the production site into `dist/`, then indexes it for search. |
| `npm run preview`                  | Serves `dist/` exactly as it will be published (search works here).  |
| `npm run check`                    | Type and template checks, then Prettier formatting check.            |
| `npm run format`                   | Formats the code with Prettier.                                      |
| `npm test`                         | Tests shared logic and the built site. Run `npm run build` first.    |
| `node scripts/check-site.mjs dist` | Confirms every old URL still exists and no internal link is broken.  |

## Writing a post

Create `_posts/YYYY-MM-DD-short-name.md`:

```markdown
---
title: "My new post"
date: 2026-11-02
description: One or two sentences shown in listings, search results and link previews.
tags: [aws, terraform]
categories: [startup]
permalink: /blog/2026/my-new-post/
giscus_comments: true # shows a link to GitHub Discussions under the post
---

The post body, in Markdown.
```

- `permalink` is required and is the post's public address. It must look like `/blog/YYYY/name/`, and the year in it decides which year archive lists the post. Never change it after publishing.
- `tags` and `categories` create the `/blog/tag/<name>/` and `/blog/category/<name>/` archive pages automatically.
- Code blocks are highlighted. A ` ```mermaid ` block becomes a diagram in the browser, and readers without JavaScript see its source.
- A `date` without a time zone offset is read as UTC and shown exactly as written. Add an offset (`2026-11-02T09:00:00+00:00`) only if the time matters for when a post goes live.

### Drafts and future dates

Add `draft: true` (or Jekyll's `published: false`) to keep a post unpublished. A post dated in the future is also left out. Both still show in `npm run dev` so you can preview them, but production builds leave them out of every page, archive, the feed, the sitemap and search.

New content only appears after the site is rebuilt. A future-dated post therefore goes live at the first deployment after its date: push any change to `main`, or run the **Deploy site** workflow manually from the Actions tab.

### Images

Put images in a folder for the post, for example `assets/img/2026-11-02-my-new-post/`, and reference them by their public path:

```markdown
![Describe what the image shows](/assets/img/2026-11-02-my-new-post/diagram.png)
```

Everything in `assets/img/`, `assets/pdf/` and `assets/json/` is published at the same path. To show several images as a swipeable gallery with an enlarged view, use the markup in the existing article, `_posts/2024-07-01-ht-startup-w-devops-p01.md`. Its `srcset` lists smaller WebP copies so readers download a light image first; the enlarged view and the link always use the full-size original.

## Announcements

Short announcements live in `_news/`, with the same frontmatter (`title`, `date`, `tags`, optional `draft`) and a `permalink` of the form `/news/<name>/`. The latest five are shown on the home page.

## CV

- The CV page is generated from `assets/json/resume.json` ([JSON Resume](https://jsonresume.org/schema) format). Edit that file and rebuild. Only the sections named in `src/lib/resume.ts` are shown; a new kind of top-level section needs a title there and its layout in `src/components/Resume.astro`. Empty sections are hidden and ongoing roles (no `endDate`) show “Present”.
- The downloadable PDF is `assets/pdf/cv.pdf`. It is not generated from the JSON: replace the file yourself whenever the CV changes.

## Policies

The Terms and Privacy Policy and the Cookie Policy are `src/pages/terms.astro` and `src/pages/cookies.astro`. Their version history tables come from `assets/json/vh_terms.json` and `assets/json/vh_cookies.json`. When you change a policy, add an entry to its history file.

If you add anything that loads from another website (analytics, embeds, fonts) or stores data in the browser, update both policies first. `npm test` fails if known tracking scripts or third-party resources appear in the built pages.

## Publishing

`.github/workflows/deploy.yml` runs on every pull request and every push to `main`. It installs dependencies, runs `npm run check`, builds, runs the tests and `scripts/check-site.mjs`. Pull requests stop there. On `main`, the checked `dist/` folder is pushed to the `gh-pages` branch, which GitHub Pages serves. The custom domain comes from `public/CNAME`.

The **Axe accessibility testing** workflow can be run manually from the Actions tab against the built site.

## Project layout

| Path                                         | Contents                                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `_posts/`, `_news/`                          | Articles and announcements (Markdown)                                               |
| `assets/img/`, `assets/pdf/`, `assets/json/` | Published images, CV PDF, résumé and policy history                                 |
| `src/pages/`                                 | One file per page or route, plus the feed and sitemap                               |
| `src/layouts/`, `src/components/`            | Shared page frames and building blocks                                              |
| `src/lib/`                                   | Content rules (publishing, URLs, dates), résumé and XML helpers                     |
| `src/styles/global.css`                      | Site styles, including light and dark themes                                        |
| `scripts/`                                   | Build helpers and the published-output checker                                      |
| `tests/`                                     | Node tests; `tests/fixtures/legacy-site.json` lists the URLs that must keep working |

## Licence

The site was originally built on the [al-folio](https://github.com/alshedivat/al-folio) Jekyll theme, whose MIT licence is kept in `LICENSE`.
