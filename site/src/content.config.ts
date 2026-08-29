import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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

const hero = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/hero' }),
  schema: z.object({
    heading: z.string(),
    sub: z.string(),
    ctaPrimaryLabel: z.string(),
    ctaPrimaryHref: z.string(),
    ctaSecondaryLabel: z.string(),
    ctaSecondaryHref: z.string(),
    cards: z.array(
      z.object({
        icon: z.string(),
        title: z.string(),
        summary: z.string(),
      }),
    ),
  }),
});

const intro = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/intro' }),
  schema: z.object({
    heading: z.string(),
    paragraph: z.string(),
  }),
});

const wsparcie = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/wsparcie' }),
  schema: z.object({
    title: z.string(),
    standfirst: z.string(),
    scopeTitle: z.string(),
    scopeItems: z.array(z.string()),
    premiumTitle: z.string(),
    premiumDescription: z.string(),
    tiers: z.array(
      z.object({
        name: z.string(),
        price: z.string(),
        hours: z.string(),
        highlighted: z.boolean().optional(),
        badge: z.string().optional(),
      }),
    ),
    bezpiecznikLabel: z.string(),
    bezpiecznikPrice: z.string(),
    bezpiecznikSuffix: z.string(),
  }),
});

const drive = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/drive' }),
  schema: z.object({
    title: z.string(),
    standfirst: z.string(),
    paths: z.array(
      z.object({
        icon: z.string(),
        kicker: z.string(),
        title: z.string(),
        price: z.string(),
        priceNote: z.string(),
        before: z.string(),
        bold: z.string(),
        after: z.string(),
      }),
    ),
  }),
});

const omnie = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/omnie' }),
  schema: z.object({
    kicker: z.string(),
    heading: z.string(),
    bio: z.array(z.string()),
    signatureName: z.string(),
    signatureRole: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
    photoAlt: z.string(),
  }),
});

const cta = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cta' }),
  schema: z.object({
    heading: z.string(),
    sub: z.string(),
    panelIcon: z.string(),
    panelTitle: z.string(),
    panelBody: z.string(),
    formTitle: z.string(),
    formStandfirst: z.string(),
  }),
});

const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    canonical: z.string(),
    phone: z.string(),
    phoneHref: z.string(),
    email: z.string(),
    addressStreet: z.string().optional(),
    addressPostal: z.string().optional(),
    addressCity: z.string().optional(),
    addressCountry: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    instagramHandle: z.string().optional(),
    benefitsHeading: z.string(),
    testimonialsHeading: z.string(),
    faqHeading: z.string(),
    footerCopyright: z.string(),
    nav: z.array(z.object({ label: z.string(), href: z.string() })),
  }),
});

export const collections = { benefits, testimonials, faq, hero, intro, wsparcie, drive, omnie, cta, site };
