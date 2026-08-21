// https://nuxt.com/docs/api/configuration/nuxt-config

import { promises as fs } from 'node:fs'
import { join } from 'node:path'

let routeRules = {}

if (!import.meta.dev) {
    routeRules = {
        '/': {
            swr: true,
        },
        '/api/repo/readme': {
            swr: 60 * 60,
        },
        '/repos/**': {
            swr: 60 * 5,
        },
        '/tech/**': {
            swr: 60 * 60,
        },
        '/cv': {
            swr: 60 * 60 * 6,
        },
    }
}

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',

    runtimeConfig: {
        forgejoRenderMarkdownToken: '',
        wakapi: {
            baseUrl: '',
            user: '',
            apiKey: '',
            frecencyNumDays: 90,
        },
        public: {
            forgejoBaseUrl: '',
            primaryUser: '',
            version: 'local',
            buildDate: '1970-01-01',
        },
    },

    app: {
        pageTransition: { name: 'page', mode: 'default' },
    },

    routeRules: routeRules,

    vite: {
        optimizeDeps: {
            include: [
                '@js-temporal/polyfill',
                '@vue/devtools-core',
                '@vue/devtools-kit',
                'vue-json-pretty',
                'vue-icons-plus/go',
            ],
        },
    },

    devtools: {
        enabled: true,

        timeline: {
            enabled: true,
        },
    },

    hub: {
        cache: true,
        kv: true,
    },

    content: {
        build: {
            markdown: {
                highlight: false,
            },
        },
        renderer: {
            anchorLinks: false,
        },
    },

    sitemap: {
        sources: ['/api/sitemap'],
    },

    hooks: {
        async 'prerender:routes'(ctx) {
            const dir = join(process.cwd(), 'content/portfolio')
            const files = await fs.readdir(dir)

            for (const file of files) {
                ctx.routes.add(`/portfolio/${file.replace(/\.md$/, '')}`)
            }
        },
    },

    experimental: {
        payloadExtraction: 'client',
        viewTransition: false,
    },

    modules: ['@nuxthub/core', '@nuxt/content', '@nuxtjs/sitemap', '@nuxt/image'],
})
