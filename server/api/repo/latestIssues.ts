import { issueListIssues } from '~~/lib/forgejo'
import { defineRepoContentHandler } from './util'
import type { RepoRequestData } from '.'

export const getLatestRepoIssues = async (repoRequestData: RepoRequestData) => {
    const issues = await issueListIssues({
        path: repoRequestData.path,
        query: { limit: 25, state: 'all', sort: 'latest' },
    })

    if (issues.error) throw issues.error

    return issues.data
}

export default defineRepoContentHandler(async (event, repoRequestData) => {
    return await getLatestRepoIssues(repoRequestData)
})
