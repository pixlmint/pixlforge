import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: 'https://git.pixlmint.ch/swagger.v1.json',
    output: 'server/lib/api/generated',
    plugins: [
        '@hey-api/client-fetch',
        '@tanstack/vue-query',
    ],
})
