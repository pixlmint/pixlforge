import { userListRepos } from '~~/lib/forgejo'
import { Temporal } from '@js-temporal/polyfill'
import { searchProjects } from '../project/search'

export const getRepos = async () => {
    const repos = await userListRepos({
        path: { username: useRuntimeConfig().public.primaryUser },
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
