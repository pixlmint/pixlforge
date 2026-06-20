import { repoGetAllCommits, repoListBranches } from '~~/lib/forgejo'
import { Temporal } from '@js-temporal/polyfill'
import type { H3Event } from 'h3'
import type { HistoryCommit } from '~~/shared/types'
import type { Commit, CommitMeta, Branch } from '~~/lib/forgejo'

const historyCommitToCommitMeta = (commit: HistoryCommit): CommitMeta => {
    return {
        created: commit.timestamp,
        sha: commit.sha,
    }
}

const linkChildren = (commitMap: Map<string, HistoryCommit>) => {
    commitMap.forEach((commit, sha) => {
        commit.parents.forEach((parentMeta) => {
            const parent = commitMap.get(parentMeta.sha)

            if (parent === null || parent === undefined) {
                return
            }

            if (!parent.children.map((childMeta) => childMeta.sha).includes(sha)) {
                parent.children.push(historyCommitToCommitMeta(commit))
            }
        })
    })
}

const buildCommitMap = (
    branchCommits: {
        branch: string
        commits: Commit[]
    }[],
): Map<string, HistoryCommit> => {
    const commitMap = new Map<string, HistoryCommit>()

    // Build Commit Map
    branchCommits.forEach((branch) => {
        branch.commits.forEach((commit) => {
            const commitSha = commit.sha!
            if (!commitMap.has(commitSha)) {
                let commitMessage
                if (commit.commit?.message === undefined || commit.commit.message === null) {
                    commitMessage = '<empty>'
                } else {
                    commitMessage = commit.commit.message
                }
                const historyCommit: HistoryCommit = {
                    sha: commitSha,
                    author: commit.committer?.login || '<empty>',
                    parents: commit.parents || [],
                    children: [],
                    timestamp: Temporal.Instant.from(commit.created!),
                    branchNames: [],
                    isMerge: (commit.parents || []).length > 1,
                    message: commitMessage,
                }
                commitMap.set(commitSha, historyCommit)
            }
            const node = commitMap.get(commitSha)!
            if (!node.branchNames.includes(branch.branch)) {
                node.branchNames.push(branch.branch)
            }
        })
    })

    return commitMap
}

const assignCommitTips = (commitMap: Map<string, HistoryCommit>) => {
    const untippedCommits = (): HistoryCommit[] => {
        return commitMap
            .values()
            .toArray()
            .filter((commit) => commit.tip === undefined)
            .sort((a, b) => {
                return Temporal.Instant.compare(a.timestamp, b.timestamp)
            })
            .reverse()
    }

    let currentUntippedCommits = untippedCommits()

    const MAX_ITERATIONS = 500

    let outerIterations = 0
    let innerIterations = 0
    while (currentUntippedCommits.length > 0 && outerIterations < MAX_ITERATIONS) {
        let currentCommit = currentUntippedCommits[0]!
        let tipSha: string = currentCommit.sha
        let currentParent: HistoryCommit | undefined

        if (currentCommit.headOf !== undefined) {
            currentCommit.tip = currentCommit.sha
        }

        innerIterations = 0
        while (
            innerIterations < MAX_ITERATIONS &&
            currentCommit.parents.length > 0 &&
            (currentParent = commitMap.get(currentCommit.parents[0]!.sha)) !== undefined &&
            currentParent.tip === undefined
        ) {
            currentParent.tip = tipSha
            currentCommit = currentParent
            innerIterations++
        }

        currentUntippedCommits = untippedCommits()
        outerIterations++
    }

    if (innerIterations - 10 >= MAX_ITERATIONS || outerIterations - 10 >= MAX_ITERATIONS) {
        console.error(
            `Exceeded MAX_ITERATIONS (${MAX_ITERATIONS}): innerIterations=${innerIterations}, outerIterations=${outerIterations}`,
        )
    }
}

const assignColumns = (
    commitMap: Map<string, HistoryCommit>,
    branches: Branch[],
): HistoryCommit[] => {
    const commits = commitMap
        .values()
        .toArray()
        .sort((a, b) => {
            return Temporal.Instant.compare(a.timestamp, b.timestamp)
        })
        .reverse()

    let reservedColumns: (string | undefined)[] = []

    const firstFree = (): number => {
        const firstIndex = reservedColumns.indexOf(undefined)
        if (firstIndex !== -1) {
            return firstIndex
        }
        reservedColumns.push(undefined)
        return reservedColumns.length - 1
    }

    /*
        Lane/ Column assignment algorithm provided by Claude Opus 4.8
        
        Definitions:
        - Lane: "A logical strand of history"
        - Column: "A physical slot" (column defines the x-position of the commit
                  in relation to the other commits)

        Runtime: Approx. O(n * W) (n=number of commits, W=max. number of concurrent columns)

        Explanation:
        This algorithm works by processing each commit in reverse chronological
        ordering (latest - oldest)
        For each of a commits parents, we 'reserve' a column instead of assigning it.
        This distinction is crucial, because a commit appearing later than the current
        one might actually be a direct descendant of that parent, and because that
        commit must be allowed to change, which column is reserved for that parent.

        This way, a commits column reservation can be changed only until it is processed.
        Once it was processed, the column for that commit cannot be changed anymore
    */
    for (const commit of commits) {
        // Was a column reserved for this commit? (see below how reservation happens)
        let column = reservedColumns.indexOf(commit.sha)
        if (column === -1) {
            column = firstFree()
        }
        // assign either the previously reserved column,
        // or the newly initialized one, to the current commit
        commit.column = column

        // clear whatever columns in the reservedColumns array are
        // reserved for the current commit
        for (let i = 0; i < reservedColumns.length; i++) {
            if (reservedColumns[i] === commit.sha) {
                reservedColumns[i] = undefined
            }
        }

        // iterate over all parents. The first parent (parents[0]) belongs to the
        // same lane as the current commit.
        // For every parent but the first, that doesn't have a column reserved already,
        // reserve a fresh column for it (that parent might either be the head of a new lane, or
        // the parent to a commit we haven't processed yet)
        commit.parents.forEach((parentMeta, index) => {
            if (reservedColumns.includes(parentMeta.sha)) return

            if (index === 0 && reservedColumns[column] === undefined) {
                reservedColumns[column] = parentMeta.sha
            } else {
                reservedColumns[firstFree()] = parentMeta.sha
            }
        })

        // remove all columns that are reserved to `undefined`, until the first
        // that's reserved for a real commit (or there are no more reserved columns)
        while (reservedColumns.length > 0 && reservedColumns.at(-1) === undefined) {
            reservedColumns.pop()
        }
    }

    return commits
}

export const buildCommitGraph = async (repo: string, owner: string) => {
    const branches = await repoListBranches({ path: { owner: owner, repo: repo } })

    const commitsPromises = branches.data!.map(async (branch) => {
        const branchCommits = await repoGetAllCommits({
            path: {
                owner: owner,
                repo: repo,
            },
            query: {
                sha: branch.name!,
                limit: 2000,
            },
        })

        return {
            branch: branch.name!,
            commits: branchCommits.data!,
        }
    })

    const branchCommits = await Promise.all(commitsPromises)

    const commitMap = buildCommitMap(branchCommits)

    branches.data!.forEach((branch) => {
        if (branch.commit === undefined) {
            return
        }

        const head = commitMap.get(branch.commit.id!)

        if (head !== undefined) {
            head.headOf = branch.name!
        }
    })

    linkChildren(commitMap)
    assignCommitTips(commitMap)

    return assignColumns(commitMap, branches.data!)
}

export const testHelpers = {
    buildCommitGraph,
    linkChildren,
    buildCommitMap,
}
