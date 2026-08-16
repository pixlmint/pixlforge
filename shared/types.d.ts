import { Temporal } from '@js-temporal/polyfill'

export type Serialize<T> = T extends Temporal.Instant
    ? string // If it's a Temporal, turn it into a string
    : T extends Date
      ? string
      : T extends Array<infer U>
        ? Array<Serialize<U>> // If it's an array, serialize the elements inside
        : T extends object
          ? { [K in keyof T]: Serialize<T[K]> } // If it's an object, serialize its properties
          : T // Otherwise, leave it alone (string, number, boolean, etc.)

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

export type SerializedProjectSearchResult = Serialize<ProjectSearchResult>

type RepoReadme = {
    raw?: string
    html?: string
    portfolio?: PortfolioCollectionItem | null
}
