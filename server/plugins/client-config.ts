import { client as forgejoClient } from '~~/lib/forgejo/client.gen'
import { client as wakapiClient } from '~~/lib/wakapi/client.gen'

export default defineNitroPlugin(async (nitroApp) => {
    forgejoClient.setConfig({
        baseUrl: useRuntimeConfig().public.forgejoBaseUrl + '/api/v1',
    })

    wakapiClient.setConfig({
        baseUrl: useRuntimeConfig().wakapi.baseUrl + '/api',
        auth: 'Basic ' + btoa(useRuntimeConfig().wakapi.apiKey),
    })
})
