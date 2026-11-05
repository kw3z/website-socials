import { z } from 'zod';

const https = z.string().url().refine((u) => u.startsWith('https://'), 'must be https');

export const groupSchema = z.enum(['social', 'gaming', 'dev']);

export const linkSchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string().min(1),
    kind: z.literal('link'),
    platform: z.string(),
    icon: z.string(), // simple-icons slug or custom icon name
    group: groupSchema,
    href: https,
    display: z.string(),
    copy: z.string().optional(),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('handle'),
    platform: z.string(),
    icon: z.string(),
    group: groupSchema,
    label: z.string(),
    value: z.string(),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('email'),
    platform: z.literal('Email'),
    icon: z.literal('mail'),
    group: groupSchema,
    address: z.string().email(),
  }),
]);

export const projectSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().max(200),
  variant: z.enum(['lead', 'standard', 'upcoming']),
  status: z.enum(['live', 'soon']),
  logo: z.string().optional(), // key in src/assets/images/projects/
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  links: z
    .array(z.object({ label: z.string(), href: https, kind: z.enum(['live', 'repo', 'site']) }))
    .min(1),
});

export type SocialEntry = z.infer<typeof linkSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Group = z.infer<typeof groupSchema>;
