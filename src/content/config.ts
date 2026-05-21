import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    aiAssisted: z.boolean().default(false),
    draft: z.boolean().default(false),
    // Optional fields for about-profile dynamic mapping
    motto: z.string().optional(),
    identity: z.string().optional(),
    timezone: z.string().optional(),
    securityLevel: z.string().optional(),
    coordinates: z.array(z.string()).optional(),
    interestsSummary: z.string().optional(),
    dataMatrixSummary: z.string().optional(),
    formatSummary: z.string().optional(),
  }),
});

export const collections = { blog };