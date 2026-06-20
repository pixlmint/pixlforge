import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
    input: 'https://git.pixlmint.ch/swagger.v1.json',
    output: 'lib/generated',
})
