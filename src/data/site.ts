export const site = {
  title: 'This is My Pattern',
  author: 'Fethi Ozdol',
  description: "Hi, I'm Fethi. I'm an AWS solutions architect, and This is My Pattern.",
  blogDescription: 'My software development and delivery patterns on AWS cloud.',
  contactNote: 'I favor text to exchange ideas, so LinkedIn or X is the best way to reach me.',
  cvPdf: '/assets/pdf/cv.pdf',
  portrait: { src: '/assets/img/prof_pic.webp', width: 960, height: 1200 },
  githubUser: 'fethiozdol',
  discussionsUrl: 'https://github.com/fethiozdol/fethiozdol.github.io/discussions',
  email: 'info@thisismypattern.com',
  googleSiteVerification: '5Lhp1lN5mNB84LS6y_8GsdoHcwSb29xxGr1LlOvbF5w',
  links: {
    linkedin: 'https://www.linkedin.com/in/mfethio',
    x: 'https://twitter.com/mfethio',
    github: 'https://github.com/fethiozdol',
  },
} as const;

export const nav = [
  { href: '/', label: 'About' },
  { href: '/blog/', label: 'Writing' },
  { href: '/cv/', label: 'Experience' },
  { href: '/repositories/', label: 'Repositories' },
] as const;

/** Percent-encodes every character so the address is not plain text in the HTML, as the old site did. */
export function obfuscatedMailto(address: string = site.email): string {
  return `mailto:${[...address].map((c) => (/[a-z]/i.test(c) ? `%${c.charCodeAt(0).toString(16).toUpperCase()}` : c)).join('')}`;
}
