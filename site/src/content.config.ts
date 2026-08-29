import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// NOTE: the "services" collection (generic N-item service-tile loop, no
// pricing fields) was removed 2026-08-28 as part of the mockup-copy
// restoration (docs/adr/003-mockup-copy-restoration.md). The restored
// content is exactly two fixed, differently-shaped offers — Delegate
// Wsparcie (bullet scope + premium upsell + 3-tier pricing table) and
// Delegate Drive (2-path pricing cards) — which don't fit a generic
// collection loop. That content is hardcoded directly in Services.astro
// instead of forced into a CMS collection; see the comment there.

const benefits = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/benefits' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    icon: z.string().optional(),
    description: z.string(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({
    company: z.string(),
    quote: z.string(),
    author: z.string().optional(),
    order: z.number(),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    order: z.number(),
  }),
});

export const collections = { benefits, testimonials, faq };
