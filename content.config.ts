import { defineContentConfig, defineCollection } from '@nuxt/content'
import z from 'zod'

export default defineContentConfig({
    collections: {
        portfolio: defineCollection({
            type: 'page',
            source: 'portfolio/**/*.md',
            schema: z.object({
                date: z.date().optional(),
                tags: z.array(z.string()).optional(),
                repository: z.string().optional(),
                externalRepository: z.string().optional(),
                lastWorkedOn: z.date().optional(),
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
