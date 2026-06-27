import type { RepoRequestData } from '.'
import { defineRepoContentHandler } from './util'
import { buildCommitGraph } from '~~/server/lib/commit-tree'

export const getCommitGraph = async (requestData: RepoRequestData) => {
    return await buildCommitGraph(requestData.path.repo, requestData.path.owner)
}

export default defineRepoContentHandler(async (event, repoRequestData) => {
    return await getCommitGraph(repoRequestData)
})
