export type CommitLane = {
    id: string
    name?: string
    isVirtualBranch: boolean
}

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
    lane?: CommitLane
}
