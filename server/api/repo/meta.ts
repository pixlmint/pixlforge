import { repoGet } from '~~/lib/forgejo'
import { defineRepoContentHandler } from './util'
import type { RepoRequestData } from '.'
import type { H3Event } from 'h3'

export type ProjectMeta = {
    lastUpdated?: string
    lastUsed?: string
    tags?: string[]
    hasIssues: boolean
    hasActions: boolean
    archived: boolean
}

export const getRepoMeta = async (
    event: H3Event,
    requestData: RepoRequestData,
): Promise<ProjectMeta> => {
    const metaResponse = await repoGet(requestData)

    if (metaResponse.error) throw metaResponse.error

    const repoName = requestData.path.repo

    const portfolioItem = await queryCollection(event, 'portfolio')
        .orWhere((query) =>
            query.where('repository', 'LIKE', repoName).where('title', 'LIKE', repoName),
        )
        .first()

    const meta = metaResponse.data

    let tags = portfolioItem?.tags ?? []
    tags = [meta.language!.toLowerCase(), ...tags]

    return {
        hasIssues: meta.has_issues ?? false,
        hasActions: meta.has_actions ?? false,
        archived: meta.archived ?? true,
        tags: tags,
    }
}

export default defineRepoContentHandler(async (event, repoRequestData) => {
    return await getRepoMeta(event, repoRequestData)
})
