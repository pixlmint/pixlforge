import type { CreateClientConfig } from './forgejo/client.gen'

export const createClientConfig: CreateClientConfig = (config) => ({
    ...config,
    baseUrl: 'https://example.com',
})
