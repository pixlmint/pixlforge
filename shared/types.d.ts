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
