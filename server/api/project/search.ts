import z from 'zod'
import { Temporal } from '@js-temporal/polyfill'
import type { H3Event } from 'h3'
import { repoGet, repoListBranches, userListRepos } from '~~/lib/forgejo'
import type { Repository } from '~~/lib/forgejo'
import type {
    CollectionQueryBuilder,
    CollectionQueryGroup,
    PortfolioCollectionItem,
    SQLOperator,
} from '@nuxt/content'
import type { ProjectSearchResult } from '~~/shared/types'
import { createWakapiWrapper } from '~~/server/lib/wakapi'
import type {
    ListQueryOperator,
    ProjectFilter,
    QueryOperator,
    SearchOptions,
} from '~~/server/types'
import { isProjectIncluded } from '~~/server/lib/search-utils'

const op = z.literal(['eq', 'ge', 'le', 'gt', 'lt', 'in', 'nin', 'any', 'all'])

const filterBy = z.literal(['tags', 'archived', 'latestUpdate', 'lastUsed'])
const filter = z.object({
    field: filterBy.optional(),
    value: z.any().optional(),
    operator: op.optional(),
    get and() {
        return z.array(filter).optional()
    },
    get or() {
        return z.array(filter).optional()
    },
})

const searchRequestSchema = z.object({
    order: z.literal(['title', 'latestUpdate', 'lastUsed', 'lastUsedFrecency']).default('title'),
    orderDirection: z.literal(['asc', 'desc']).default('asc'),
    filter: filter.optional(),
})

const queryFilterOperatorToSqlOperator = (op: QueryOperator | ListQueryOperator): SQLOperator => {
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
        case 'any':
        case 'in':
            return 'IN'
        case 'nin':
            return 'NOT IN'
        case 'all':
            return '='
    }
}

const portfolioEntryToProjectSearchResult = (
    entry: PortfolioCollectionItem,
): ProjectSearchResult => {
    let latestUpdate = Temporal.Instant.fromEpochMilliseconds(0)
    if (entry.lastWorkedOn) {
        try {
            latestUpdate = Temporal.Instant.from(entry.lastWorkedOn)
        } catch (e) {
            latestUpdate = Temporal.PlainDateTime.from(entry.lastWorkedOn)
                .toZonedDateTime('UTC')
                .toInstant()
        }
    } else if (entry.date) {
        try {
            latestUpdate = Temporal.Instant.from(entry.date)
        } catch (e) {
            latestUpdate = Temporal.PlainDateTime.from(entry.date)
                .toZonedDateTime('UTC')
                .toInstant()
        }
    }

    return {
        title: entry.title,
        description: entry.description,
        portfolioId: entry.path,
        forgeId: entry.repository,
        latestUpdate: latestUpdate,
        tags: entry.tags ?? [],
        archived: false,
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
        archived: repo.archived,
    }
}

const applyFilterToQuery = <T>(
    filter: ProjectFilter,
    query: CollectionQueryBuilder<T> | CollectionQueryGroup<T>,
): CollectionQueryBuilder<T> | CollectionQueryGroup<T> => {
    if (filter.field !== undefined) {
        switch (filter.field) {
            case 'latestUpdate':
                query = query.where(
                    'lastWorkedOn',
                    queryFilterOperatorToSqlOperator(filter.operator!),
                    filter.value,
                )
                break
            case 'tags':
                const op = filter.operator! === 'in' ? 'LIKE' : 'NOT LIKE'
                query = query.where('tags', op, `%${filter.value}%`)
                break
            case 'archived':
                query = query.where('title', 'LIKE', '%')
        }
    }

    if (filter.and !== undefined) {
        query.andWhere((andQuery) => {
            let curQuery = andQuery
            filter.and!.forEach((andFilter) => {
                curQuery = applyFilterToQuery(andFilter, curQuery)
            })

            return curQuery
        })
    }

    if (filter.or !== undefined) {
        query.orWhere((orQuery) => {
            let curQuery = orQuery
            filter.or!.forEach((orFilter) => {
                curQuery = applyFilterToQuery(orFilter, curQuery)
            })

            return curQuery
        })
    }

    return query
}

const findPortfolioEntries = async (
    event: H3Event,
    filter: ProjectFilter,
): Promise<ProjectSearchResult[]> => {
    let query = applyFilterToQuery(
        filter,
        queryCollection(event, 'portfolio'),
    ) as CollectionQueryBuilder<PortfolioCollectionItem>

    let items = await query.all()

    return await Promise.all(
        items
            .map(portfolioEntryToProjectSearchResult)
            .map(async (entry) => {
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
            })
            .filter(async (project) => {
                return isProjectIncluded(await project, filter)
            }),
    )
}

interface ApiResponse<T> {
    data: T
    error: any
}

export const getAll = async <
    TResponse extends ApiResponse<any>,
    TOptions extends { query?: { limit?: number; page?: number } },
>(
    fn: (options: TOptions) => Promise<TResponse>,
    options: TOptions,
): Promise<TResponse> => {
    let latestResponse: any[] = []

    const fullResponse: TResponse = {
        data: [] as any[],
        error: undefined,
    }

    options.query ??= {}
    options.query.page = 1
    options.query.limit = 50

    do {
        const response = await fn(options)

        if (response.error) throw response.error

        latestResponse = response.data!

        if (latestResponse.data !== undefined) {
            latestResponse = latestResponse.data
        }

        fullResponse.data.push(...latestResponse)

        options.query.page++
    } while (latestResponse.length === 50)

    return fullResponse
}

const getRepoLastCommitted = async (repo: Repository): Promise<Temporal.Instant> => {
    const branches = await repoListBranches({
        path: { owner: repo.owner!.login!, repo: repo.name! },
    })

    if (branches.error || branches.data === null || branches.data === undefined) {
        return Temporal.Instant.fromEpochMilliseconds(0)
    }

    const latestBranchCommitDates = branches.data
        .map((branch) => {
            return branch.commit?.timestamp !== undefined
                ? Temporal.Instant.from(branch.commit?.timestamp)
                : undefined
        })
        .filter((d) => d !== undefined)
        .sort(Temporal.Instant.compare)

    return latestBranchCommitDates.length > 0
        ? latestBranchCommitDates[0]!
        : Temporal.Instant.from(repo.updated_at!)
}

const findRepositories = async (
    event: H3Event,
    filter: ProjectFilter,
    exclude?: Set<string | undefined>,
): Promise<ProjectSearchResult[]> => {
    let repos: Repository[] = []
    const result = await getAll(userListRepos, {
        path: { username: useRuntimeConfig().public.primaryUser },
    })

    if (result.error) {
        throw result.error
    } else {
        repos = result.data
    }

    if (exclude !== undefined) {
        repos = repos.filter((repo) => !exclude.has(repo.name!))
    }

    for (const repo of repos) {
        const lastUpdateAt = await getRepoLastCommitted(repo)
        repo.updated_at = lastUpdateAt.toString()
    }

    return await Promise.all(
        repos
            .map(repositoryEntryToProjectSearchResult)
            // XXX: Running filters here won't take wakapi-sourced data into account
            .filter((project) => {
                return isProjectIncluded(project, filter)
            })
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

const populateWakatimeData = async (projects: ProjectSearchResult[]): Promise<void> => {
    const waka = await createWakapiWrapper()

    for (const project of projects) {
        const lastUsed = waka.getLastUsed(project.title)

        if (lastUsed !== undefined) {
            project.lastUsed = lastUsed
        } else if (project.latestUpdate !== undefined) {
            project.lastUsed = project.latestUpdate
        }
    }
}

export const searchProjects = async (
    event: H3Event,
    options: SearchOptions,
): Promise<ProjectSearchResult[]> => {
    let portfolioEntries = await findPortfolioEntries(event, options.filter ?? {})

    const getAlreadySeenRepoNames = (projects: ProjectSearchResult[]) =>
        new Set(projects.filter((proj) => proj.forgeId !== undefined).map((proj) => proj.forgeId))

    portfolioEntries.push(
        ...(await findRepositories(
            event,
            options.filter ?? {},
            getAlreadySeenRepoNames(portfolioEntries),
        )),
    )

    await populateWakatimeData(portfolioEntries)

    if (options.order?.field === undefined) {
        return portfolioEntries
    } else {
        type OrderFunction = (a: ProjectSearchResult, b: ProjectSearchResult) => number
        const orderFunction = async (): Promise<OrderFunction> => {
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

            if (options.order!.field === 'title') {
                const retval = options.order?.direction === 'asc' ? -1 : 1
                return (a, b) => {
                    if (a.title === b.title) return 0
                    if (a.title < b.title) return retval
                    return retval * -1
                }
            } else if (options.order?.field === 'latestUpdate') {
                if (options.order.direction === 'asc')
                    return (a, b) => compareDates(a.latestUpdate, b.latestUpdate)
                else return (b, a) => compareDates(a.latestUpdate, b.latestUpdate)
            } else if (options.order?.field === 'lastUsed') {
                if (options.order.direction === 'asc')
                    return (a, b) => compareDates(a.lastUsed, b.lastUsed)
                else return (b, a) => compareDates(a.lastUsed, b.lastUsed)
            } else if (options.order?.field === 'lastUsedFrecency') {
                const waka = await createWakapiWrapper()
                const until = Temporal.Now.plainDateISO().subtract(
                    new Temporal.Duration(0, 0, 0, useRuntimeConfig().wakapi.frecencyNumDays),
                )
                const heartbeats = await waka.loadHeartbeats(until)

                const frecSortFunction: OrderFunction = (a, b) => {
                    const aBeat = heartbeats[a.title]
                    const bBeat = heartbeats[b.title]
                    if (aBeat !== undefined) {
                        if (bBeat !== undefined) {
                            return aBeat - bBeat
                        } else {
                            return 1
                        }
                    } else if (bBeat !== undefined) {
                        return -1
                    } else if (a.lastUsed !== undefined && b.lastUsed !== undefined) {
                        return compareDates(a.lastUsed, b.lastUsed)
                    } else {
                        return 0
                    }
                }

                if (options.order.direction === 'asc') return (a, b) => frecSortFunction(a, b)
                else return (a, b) => frecSortFunction(b, a)
            }

            throw new Error('Unknown order key: ' + options.order?.field)
        }
        return portfolioEntries.sort(await orderFunction())
    }
}

export default defineEventHandler(async (event): Promise<ProjectSearchResult[]> => {
    const requestBody = await readValidatedBody(event, (body) => searchRequestSchema.parse(body))

    const options: SearchOptions = {
        filter: requestBody.filter,
        order: {
            field: requestBody.order,
            direction: requestBody.orderDirection,
        },
    }

    return searchProjects(event, options)
})
