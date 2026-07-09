import { Temporal } from '@js-temporal/polyfill'

export type HistoryCommit = {
    sha: string
    message: string
    timestamp: Temporal.Instant
    author: string
    parents: CommitMeta[]
    children: CommitMeta[]
    branchNames: string[]
    sourceBranch?: string
    isMerge: boolean
    headOf?: string
    column?: number
    tip?: string
}

export type ProjectSearchResult = {
    title: string
    description?: string
    portfolioId?: string
    forgeId?: string
    latestUpdate?: Temporal.Instant
    lastUsed?: Temporal.Instant
    tags?: string[]
    archived?: boolean
}

type RepoReadme = {
    raw?: string
    html?: string
    portfolio?: PortfolioCollectionItem | null
}
