import { repoGet } from '~~/lib/forgejo'
import { defineRepoContentHandler } from './util'
import type { RepoRequestData } from '.'

export const getRepoMeta = async (requestData: RepoRequestData) => {
    const meta = await repoGet(requestData)

    if (meta.error) throw meta.error

    return meta.data
}

export default defineRepoContentHandler(async (event, repoRequestData) => {
    return await getRepoMeta(repoRequestData)
})
