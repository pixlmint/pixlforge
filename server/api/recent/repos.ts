import { userListRepos } from '~~/lib/generated'
import { Temporal } from '@js-temporal/polyfill'

export const getRepos = async () => {
    const repos = await userListRepos({
        path: { username: useRuntimeConfig().primaryUser },
        query: { limit: 500 },
    })

    if (repos.error) {
        throw repos.error
    }

    return repos.data
        .filter((repo) => !repo.archived)
        .filter((repo) => repo.topics === undefined || !repo.topics.includes('fork'))
        .map((repo) => {
            return {
                name: repo.name,
                id: repo.id,
                updatedAt: Temporal.Instant.from(repo.updated_at!),
                description: repo.description,
                fork: repo.fork,
                language: repo.language,
                topics: repo.topics,
            }
        })
        .sort((a, b) => Temporal.Instant.compare(a.updatedAt, b.updatedAt))
        .reverse()
}

export default defineEventHandler(() => {
    return getRepos()
})
