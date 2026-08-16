import { getRepoMeta } from './meta'
import { defineRepoContentHandler } from './util'
import { getProjectContent } from './readme'

export type RepoRequestData = {
    path: {
        repo: string
        owner: string
    }
}

export default defineRepoContentHandler(async (event, projectRequestData, latestCommit) => {
    const projectMeta = await getRepoMeta(event, projectRequestData)
    const projectContent = await getProjectContent(event, projectRequestData, latestCommit)

    return {
        meta: projectMeta,
        readme: projectContent,
    }
})
