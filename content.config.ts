import { defineContentConfig, defineCollection } from '@nuxt/content'
import z from 'zod'

export default defineContentConfig({
    collections: {
        portfolio: defineCollection({
            type: 'page',
            source: 'portfolio/**/*.md',
            schema: z.object({
                date: z.date().optional(),
                technologies: z.array(z.string()).optional(),
                repository: z.string().optional(),
                externalRepository: z.string().optional(),
            }),
        }),
        pages: defineCollection({
            type: 'page',
            source: 'pages/**/*.md',
            schema: z.object({
                date: z.date().optional(),
            }),
        }),
    },
})
