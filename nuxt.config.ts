// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',

    devtools: {
        enabled: true,

        timeline: {
            enabled: false,
        },
    },

    hub: {
        cache: true,
    },

    css: ['~/assets/css/style.scss'],
    modules: ['@nuxthub/core'],
})
