import { repoListActivityFeeds, userListRepos } from '~~/lib/forgejo'
import { Temporal } from '@js-temporal/polyfill'
import type { Activity } from '~~/lib/forgejo'
import type { ActivityContent, ActivityType } from '../types'

export const getCombinedRepositoryFeed = async (
    op_types?: ActivityType[] | ((activity: Activity) => boolean),
) => {
    const repos = await userListRepos({
        path: { username: useRuntimeConfig().public.primaryUser },
        query: { limit: 500 },
    })

    if (repos.error) {
        throw repos.error.message
    }

    const reposActivitiesPromises = repos.data.map(async (repo) => {
        const feed = await repoListActivityFeeds({
            path: { owner: useRuntimeConfig().public.primaryUser, repo: repo.name! },
        })

        if (feed.error) {
            throw feed.error.message
        }

        if (op_types === undefined) {
            return feed.data
        } else if (typeof op_types === 'function') {
            return feed.data.filter(op_types)
        } else {
            return feed.data.filter((entry) => op_types.includes(entry.op_type!))
        }
    })

    const reposActivities = await Promise.all(reposActivitiesPromises)

    return reposActivities
        .flat()
        .sort((a, b) =>
            Temporal.Instant.compare(
                Temporal.Instant.from(a.created!),
                Temporal.Instant.from(b.created!),
            ),
        )
        .reverse()
}

export const parseActivityContent = (entry: Activity): null | ActivityContent => {
    const content = entry.content

    if (typeof content !== 'string' || content === '') {
        return null
    }

    const parsed: ActivityContent & [string, string] = JSON.parse(content)

    switch (entry.op_type) {
        case 'create_issue':
        case 'comment_issue':
            return {
                issueId: Number.parseInt(parsed[0]),
                text: parsed[1],
            }
        default:
            return parsed
    }
}

export default defineEventHandler(() => {
    return getCombinedRepositoryFeed()
})
