export type HistoryCommit = {
    sha: string
    message: string
    timestamp: Temporal.Instant
    author: string
    parents: CommitMeta[]
    branchNames: string[]
    isMerge: boolean
    headOf?: string
}
