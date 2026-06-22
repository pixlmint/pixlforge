// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',

    runtimeConfig: {
        forgejoRenderMarkdownToken: '',
        wakapi: {
            baseUrl: '',
            user: '',
            apiKey: '',
        },
        public: {
            forgejoBaseUrl: '',
            primaryUser: '',
            version: 'local',
        },
    },

    routeRules: {
        '/': {
            swr: true,
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
    },

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
    },

    modules: ['@nuxthub/core', '@nuxt/content', '@nuxtjs/sitemap'],
})
