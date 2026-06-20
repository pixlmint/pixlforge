import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig([
    {
        input: 'https://git.pixlmint.ch/swagger.v1.json',
        output: 'lib/forgejo',
    },
    {
        input: 'https://wakapi.pixlmint.ch/swagger-ui/swagger-ui/doc.json',
        output: 'lib/wakapi',
    },
])
