import type { CreateClientConfig } from './wakapi/client.gen'

export const createClientConfig: CreateClientConfig = (config) => ({
    ...config,
    baseUrl: 'https://example.com',
})
