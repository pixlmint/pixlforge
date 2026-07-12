// https://nuxt.com/docs/api/configuration/nuxt-config

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
        '/portfolio/**': {
            swr: 60 * 60 * 24,
        },
        '/cv': {
            prerender: true,
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

    experimental: {
        payloadExtraction: 'client',
        viewTransition: false,
    },

    modules: ['@nuxthub/core', '@nuxt/content', '@nuxtjs/sitemap'],
})
