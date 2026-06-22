import z from 'zod'
import { Temporal } from '@js-temporal/polyfill'
import type { H3Event } from 'h3'
import { kv } from '@nuxthub/kv'
import { repoGet, repoSearch, userListRepos } from '~~/lib/forgejo'
import type { Repository } from '~~/lib/forgejo'
import type { PortfolioCollectionItem, SQLOperator } from '@nuxt/content'
import type { ProjectSearchResult } from '~~/shared/types'
import { createWakapiWrapper } from '~~/server/lib/wakapi'

const op = z.literal(['eq', 'ge', 'le', 'gt', 'lt'])
type QueryOperator = 'eq' | 'ge' | 'le' | 'gt' | 'lt'

const searchRequestSchema = z.object({
    order: z.literal(['title', 'latestUpdate', 'lastUsed']).default('title'),
    orderDirection: z.literal(['asc', 'desc']).default('asc'),
    filterBy: z.literal(['technology', 'archived', 'latestUpdate', 'lastUsed']).optional(),
    filterOperator: op.optional(),
    filterValue: z.any().optional(),
})

type ProjectFilter = {
    field?: 'technology' | 'latestUpdate' | 'lastUsed' | 'archived'
    operator?: QueryOperator
    value?: any
}

const queryFilterOperatorToSqlOperator = (op: QueryOperator): SQLOperator => {
    switch (op) {
        case 'eq':
            return '='
        case 'ge':
            return '>='
        case 'le':
            return '<='
        case 'gt':
            return '>'
        case 'lt':
            return '<'
    }
}

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
        tags: entry.technologies ?? [],
    }
}

const repositoryEntryToProjectSearchResult = (repo: Repository): ProjectSearchResult => {
    return {
        title: repo.name!,
        description: repo.description,
        forgeId: repo.name!,
        latestUpdate: Temporal.Instant.from(repo.updated_at!),
        tags: [repo.language, ...(repo.topics ?? [])]
            .filter((tag) => typeof tag === 'string')
            .map((tag) => tag.toLowerCase()),
    }
}

const findPortfolioEntries = async (
    event: H3Event,
    filter: ProjectFilter,
): Promise<ProjectSearchResult[]> => {
    let query = queryCollection(event, 'portfolio')

    if (filter.field === 'latestUpdate') {
        query = query.where(
            'date',
            queryFilterOperatorToSqlOperator(filter.operator!),
            filter.value,
        )
    }

    let items = await query.all()

    if (filter.field === 'technology') {
        items = items.filter((item) => item.technologies?.includes(filter.value))
    }
    return await Promise.all(
        items.map(portfolioEntryToProjectSearchResult).map(async (entry) => {
            if (!entry.forgeId) return entry

            const repo = await repoGet({
                path: { owner: useRuntimeConfig().public.primaryUser, repo: entry.forgeId },
            })

            if (repo.error) {
                entry.forgeId = undefined
                return entry
            }

            if (repo.data?.name !== undefined) {
                entry.title = repo.data.name
            }

            if (repo.data?.updated_at !== undefined) {
                entry.latestUpdate = Temporal.Instant.from(repo.data.updated_at)
                entry.lastUsed = Temporal.Instant.from(repo.data.updated_at)
            }

            return entry
        }),
    )
}

const findRepositories = async (
    event: H3Event,
    filter: ProjectFilter,
    exclude?: Set<string | undefined>,
): Promise<ProjectSearchResult[]> => {
    let repos: Repository[] = []
    if (filter.field !== 'technology') {
        const result = await userListRepos({
            path: { username: useRuntimeConfig().public.primaryUser },
        })

        if (result.error) {
            throw result.error
        } else {
            repos = result.data
        }
    } else {
        const repoMap = new Map<string, Repository>()

        const topicRepos = await getTopicRepos(filter.value as string)
        topicRepos.forEach((repo) => repoMap.set(repo.name!, repo))
        const langRepos = await getLanguageRepos(filter.value as string)
        langRepos.forEach((repo) => repoMap.set(repo.name!, repo))

        repos = repoMap.values().toArray()
    }

    if (exclude !== undefined) {
        repos = repos.filter((repo) => !exclude.has(repo.name!))
    }

    if (filter.field === 'archived') {
        const expected = filter.value == 1
        repos = repos.filter((repo) => repo.archived === expected)
    }

    if (filter.field === 'latestUpdate') {
        const sourceTime = Temporal.Instant.from(filter.value)
        repos = repos.filter((repo) => {
            const cmp = Temporal.Instant.compare(sourceTime, repo.updated_at!)
            switch (filter.operator!) {
                case 'eq':
                    return cmp === 0
                case 'ge':
                    return cmp >= 0
                case 'le':
                    return cmp <= 0
                case 'gt':
                    return cmp > 0
                case 'lt':
                    return cmp < 0
            }
        })
    }

    return await Promise.all(
        repos.map(repositoryEntryToProjectSearchResult).map(async (project) => {
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

const populateWakatimeData = async (projects: ProjectSearchResult[]): Promise<void> => {
    const waka = await createWakapiWrapper()

    for (const project of projects) {
        const lastUsed = waka.getLastUsed(project.title)

        if (lastUsed !== undefined) {
            project.lastUsed = lastUsed
        }
    }
}

export const searchProjects = async (
    event: H3Event,
    filter?: ProjectFilter,
    orderBy?: string,
    orderDirection?: 'asc' | 'desc',
): Promise<ProjectSearchResult[]> => {
    let portfolioEntries = await findPortfolioEntries(event, filter ?? {})

    const getAlreadySeenRepoNames = (projects: ProjectSearchResult[]) =>
        new Set(projects.filter((proj) => proj.forgeId !== undefined).map((proj) => proj.forgeId))

    portfolioEntries.push(
        ...(await findRepositories(event, filter ?? {}, getAlreadySeenRepoNames(portfolioEntries))),
    )

    await populateWakatimeData(portfolioEntries)

    if (orderBy === undefined) {
        return portfolioEntries
    } else {
        type OrderFunction = (a: ProjectSearchResult, b: ProjectSearchResult) => number
        const orderFunction = (): OrderFunction => {
            const compareDates = (
                a: Temporal.Instant | string | undefined,
                b: Temporal.Instant | string | undefined,
            ): number => {
                if (a === undefined && b !== undefined) {
                    return -1
                } else if (a !== undefined && b === undefined) {
                    return 1
                } else if (a === undefined && b === undefined) {
                    return 0
                }
                return Temporal.Instant.compare(a!, b!)
            }

            if (orderBy === 'title') {
                const retval = orderDirection === 'asc' ? -1 : 1
                return (a, b) => {
                    if (a.title === b.title) return 0
                    if (a.title < b.title) return retval
                    return retval * -1
                }
            } else if (orderBy === 'latestUpdate') {
                if (orderDirection === 'asc')
                    return (a, b) => compareDates(a.latestUpdate, b.latestUpdate)
                else return (b, a) => compareDates(a.latestUpdate, b.latestUpdate)
            } else if (orderBy === 'lastUsed') {
                if (orderDirection === 'asc') return (a, b) => compareDates(a.lastUsed, b.lastUsed)
                else return (b, a) => compareDates(a.lastUsed, b.lastUsed)
            }

            throw new Error('Unknown order key: ' + orderBy)
        }
        return portfolioEntries.sort(orderFunction())
    }
}

export default defineEventHandler(async (event): Promise<ProjectSearchResult[]> => {
    const request = await getValidatedQuery(event, (body) => searchRequestSchema.parse(body))

    const filter: ProjectFilter = {
        field: request.filterBy,
        operator: request.filterOperator,
        value: request.filterValue,
    }

    return searchProjects(event, filter, request.order, request.orderDirection)
})
