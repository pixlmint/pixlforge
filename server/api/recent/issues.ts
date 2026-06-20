import { issueSearchIssues } from '~~/lib/forgejo'
import { Temporal } from '@js-temporal/polyfill'

export const getIssues = async () => {
    const issues = await issueSearchIssues({ query: { limit: 25, state: 'all', sort: 'latest' } })

    if (issues.error) {
        throw issues.error
    }

    return issues.data.map((issue) => {
        return {
            title: issue.title,
            createdAt: Temporal.Instant.from(issue.created_at!),
            updatedAt: Temporal.Instant.from(issue.updated_at!),
            state: issue.state,
            repository: issue.repository!,
        }
    })
}

export default defineEventHandler(() => {
    return getIssues()
})
