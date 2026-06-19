import z from 'zod'
import { Temporal } from '@js-temporal/polyfill'
import type { H3Event } from 'h3'
import { kv } from '@nuxthub/kv'
import { repoGet, repoSearch, userListRepos } from '~~/lib/generated'
import type { Repository } from '~~/lib/generated'
import type { PortfolioCollectionItem } from '@nuxt/content'
import type { ProjectSearchResult } from '~~/shared/types'

const searchRequestSchema = z.object({
    technology: z.string().optional(),
    order: z.literal(['title', 'latestUpdate', 'lastUsed']).default('title'),
    orderDirection: z.literal(['asc', 'desc']).default('asc'),
})

const portfolioEntryToProjectSearchResult = (
    entry: PortfolioCollectionItem,
): ProjectSearchResult => {
    return {
        title: entry.title,
        description: entry.description,
        portfolioId: entry.path,
        forgeId: entry.repository,
        latestUpdate: entry.date
            ? Temporal.Instant.from(entry.date)
            : Temporal.Instant.fromEpochMilliseconds(0),
    }
}

const repositoryEntryToProjectSearchResult = (repo: Repository): ProjectSearchResult => {
    return {
        title: repo.name!,
        description: repo.description,
        forgeId: repo.name!,
        latestUpdate: Temporal.Instant.from(repo.updated_at!),
    }
}

const getTechnologyPortfolioEntries = async (
    event: H3Event,
    tech: string,
): Promise<PortfolioCollectionItem[]> => {
    const key = `portfolio_tech_${tech}`
    if (!import.meta.dev) {
        if (await kv.hasItem(key)) {
            return (await kv.getItem(key)) as PortfolioCollectionItem[]
        }
    }

    const entries = await queryCollection(event, 'portfolio')
        .all()
        .then((allEntries) =>
            allEntries.filter(
                (entry) => entry.technologies !== null && entry.technologies!.includes(tech),
            ),
        )

    if (!import.meta.dev) {
        await kv.setItem(key, entries)
    }

    return entries
}

const getTopicRepos = async (tech: string) => {
    // TODO: don't hardcode owner id
    const results = await repoSearch({ query: { q: tech, topic: true, priority_owner_id: 1 } })

    if (results.error) throw results.error

    return results.data.data!
}

const getLanguageRepos = defineCachedFunction(
    async (tech: string) => {
        const repos = await userListRepos({
            path: { username: useRuntimeConfig().public.primaryUser },
            query: { limit: 2000 },
        })

        if (repos.error) throw repos.error

        return repos.data.filter((repo) => repo.language?.toLowerCase() === tech)
    },
    { maxAge: 60 * 60, getKey: (tech) => `getLanguageRepos_${tech}` },
)

export default defineEventHandler(async (event): Promise<ProjectSearchResult[]> => {
    const request = await getValidatedQuery(event, (body) => searchRequestSchema.parse(body))

    let portfolioEntries = await getTechnologyPortfolioEntries(event, request.technology!).then(
        (entries) => entries.map(portfolioEntryToProjectSearchResult),
    )

    portfolioEntries = await Promise.all(
        portfolioEntries.map(async (entry) => {
            if (!entry.forgeId) return entry

            const repo = await repoGet({
                path: { owner: useRuntimeConfig().public.primaryUser, repo: entry.forgeId },
            })

            if (repo.error) {
                entry.forgeId = undefined
                return entry
            }

            if (repo.data?.updated_at !== undefined) {
                entry.latestUpdate = Temporal.Instant.from(repo.data.updated_at)
            }

            return entry
        }),
    )

    const getAlreadySeenRepoNames = (projects: ProjectSearchResult[]) =>
        new Set(projects.filter((proj) => proj.forgeId !== undefined).map((proj) => proj.forgeId))

    const forgeProjectsHandler = async (projects: Repository[]): Promise<ProjectSearchResult[]> => {
        return await Promise.all(
            projects
                .filter((repo) => !alreadySeenRepos.has(repo.name))
                .map(repositoryEntryToProjectSearchResult)
                .map(async (project) => {
                    if (project.portfolioId !== undefined) return project

                    const entryWithRepository = await queryCollection(event, 'portfolio')
                        .where('repository', '=', project.forgeId)
                        .first()

                    if (entryWithRepository) {
                        project.portfolioId = entryWithRepository.path
                        return project
                    }

                    return project
                }),
        )
    }

    let alreadySeenRepos = getAlreadySeenRepoNames(portfolioEntries)
    const topicRepos = await getTopicRepos(request.technology!)

    portfolioEntries.push(...(await forgeProjectsHandler(topicRepos)))

    alreadySeenRepos = getAlreadySeenRepoNames(portfolioEntries)

    const languageRepos = await getLanguageRepos(request.technology!)

    portfolioEntries.push(...(await forgeProjectsHandler(languageRepos)))

    // TODO: integrate wakatime

    type OrderFunction = (a: ProjectSearchResult, b: ProjectSearchResult) => number

    const orderFunction = (): OrderFunction => {
        if (request.order === 'title') {
            const retval = request.orderDirection === 'asc' ? -1 : 1
            return (a, b) => {
                if (a.title === b.title) return 0
                if (a.title < b.title) return retval
                return retval * -1
            }
        } else if (request.order === 'latestUpdate') {
            if (request.orderDirection === 'asc')
                return (a, b) => Temporal.Instant.compare(a.latestUpdate!, b.latestUpdate!)
            else return (b, a) => Temporal.Instant.compare(a.latestUpdate!, b.latestUpdate!)
        } else if (request.order === 'lastUsed') {
            if (request.orderDirection === 'asc')
                return (a, b) => Temporal.Instant.compare(a.lastUsed!, b.lastUsed!)
            else return (b, a) => Temporal.Instant.compare(a.lastUsed!, b.lastUsed!)
        }

        throw new Error('Unknown order key: ' + request.order)
    }

    return portfolioEntries.sort(orderFunction())
})
