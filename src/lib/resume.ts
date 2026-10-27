import resume from '../../assets/json/resume.json';

export type Entry = Record<string, any>;

export const resumeData = resume as Entry;

/** The only top-level résumé sections the CV renders; any other key in the JSON stays unpublished. */
export const SECTION_TITLES: Record<string, string> = {
  basics: 'Profile',
  work: 'Experience',
  education: 'Education',
  volunteer: 'Volunteering',
  projects: 'Projects',
  sideProjects: 'Side projects',
  awards: 'Awards',
  certificates: 'Certificates',
  publications: 'Publications',
  skills: 'Skills',
  languages: 'Languages',
  interests: 'Interests',
  references: 'References',
};

export const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);

export const humanise = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

/** Populated, allowlisted top-level sections in the JSON's own order. */
export const resumeSections = Object.entries(resumeData)
  .filter(([key, value]) => Object.hasOwn(SECTION_TITLES, key) && !isEmpty(value))
  .map(([key, value]) => ({ key, title: SECTION_TITLES[key], value }));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function month(date?: string): string | undefined {
  if (!date) return undefined;
  const [year, mon] = date.split('-');
  return mon ? `${MONTHS[Number(mon) - 1]} ${year}` : year;
}

/** "Aug 2025 – Present" when there is a start date but no (or an empty) end date. */
export function range(start?: string, end?: string): string | undefined {
  return start ? `${month(start)} – ${month(end) ?? 'Present'}` : undefined;
}

export const byDateDesc = (field: string) => (a: Entry, b: Entry) => String(b[field] ?? '').localeCompare(String(a[field] ?? ''));
