import { getRepoMeta } from './meta'
import { getLatestRepoIssues } from './latestIssues'
import { getCommitGraph } from './commitGraph'
import { defineRepoContentHandler } from './util'
import { getProjectContent } from './readme'

export type RepoRequestData = {
    path: {
        repo: string
        owner: string
    }
}

export default defineRepoContentHandler(async (event, repoRequestData, latestCommit) => {
    const repoMeta = await getRepoMeta(repoRequestData)
    const projectContent = await getProjectContent(event, repoRequestData, latestCommit)
    const latestRepoIssues = await getLatestRepoIssues(repoRequestData)
    const commits = await getCommitGraph(repoRequestData)

    return {
        meta: repoMeta,
        readme: projectContent,
        issues: latestRepoIssues,
        commits: commits,
    }

    // }, {
    //     maxAge: 60 * 10,
})
