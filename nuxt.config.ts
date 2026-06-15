// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',

    runtimeConfig: {
        forgejoRenderMarkdownToken: '',
        forgejoBaseUrl: '',
        primaryUser: '',
    },

    routeRules: {
        '/api/*/*/commit-tree': {
            swr: 3600,
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
            enabled: false,
        },
    },

    hub: {
        cache: true,
    },

    modules: ['@nuxthub/core'],
})
