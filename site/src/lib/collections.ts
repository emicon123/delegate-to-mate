import { getCollection } from 'astro:content';

export type HeroCard = { icon: string; title: string; summary: string };
export type Hero = {
  heading: string;
  sub: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  cards: HeroCard[];
};

export async function getSingleton<T = any>(name: 'hero' | 'intro' | 'wsparcie' | 'drive' | 'omnie' | 'cta' | 'site'): Promise<T> {
  const col: any = await getCollection(name as any);
  const entry = col[0];
  if (!entry) throw new Error(`Missing content for singleton "${name}" — expected 1 md file in src/content/${name}/`);
  return entry.data as T;
}

export async function getSorted(name: 'benefits' | 'testimonials' | 'faq') {
  const col = await getCollection(name);
  return col.sort((a, b) => a.data.order - b.data.order);
}

export async function hasFaq(): Promise<boolean> {
  const col = await getCollection('faq');
  return col.length > 0;
}
