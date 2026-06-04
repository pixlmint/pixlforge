import { repoGetAllCommits, repoListBranches } from '~~/lib/generated'
import { Temporal } from '@js-temporal/polyfill'
import type { H3Event } from 'h3'
import type { CommitLane, HistoryCommit } from '~~/shared/types'
import type { Commit, CommitMeta, Branch } from '~~/lib/generated'

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

const createNewLane = (lanes: Map<string, CommitLane>): CommitLane => {
    const lane: CommitLane = {
        id: 'virtual_' + lanes.size.toString(),
        isVirtualBranch: true,
    }

    lanes.set(lane.id, lane)

    return lane
}

const recursiveAssignLanes = (
    currentCommit: HistoryCommit,
    commitMap: Map<string, HistoryCommit>,
    lanes: Map<string, CommitLane>,
): void => {
    if (currentCommit.lane === undefined) {
        if (currentCommit.headOf !== undefined) {
            currentCommit.lane = createNewLane(lanes)
        } else if (currentCommit.children.length === 1) {
            const child = commitMap.get(currentCommit.children[0]!.sha)

            if (child?.lane !== undefined) {
                currentCommit.lane = child.lane
            }
        }
    }

    if (currentCommit.parents.length > 0) {
        for (let i = 0; i < currentCommit.parents.length; i++) {
            const parent = commitMap.get(currentCommit.parents[i]!.sha)
            if (parent !== undefined) {
                if (parent.lane === undefined) {
                    if (i === 0) {
                        parent.lane = currentCommit.lane
                        recursiveAssignLanes(parent, commitMap, lanes)
                    } else if (
                        (parent.tip === undefined || parent.tip === currentCommit.tip) &&
                        parent.lane === undefined
                    ) {
                        parent.lane = createNewLane(lanes)
                        recursiveAssignLanes(parent, commitMap, lanes)
                    }
                }
            }
        }
    }
}

const assignLanes = (
    commitMap: Map<string, HistoryCommit>,
    branches: Branch[],
): HistoryCommit[] => {
    // map -> array, sort
    const commits = commitMap
        .values()
        .toArray()
        .sort((a, b) => {
            return Temporal.Instant.compare(a.timestamp, b.timestamp)
        })
        .reverse()

    const lanes = new Map<string, CommitLane>()

    for (const branch of branches.toSorted((a, b) => {
        const aCreated = Temporal.Instant.from(a.commit!.timestamp!)
        const bCreated = Temporal.Instant.from(b.commit!.timestamp!)
        return Temporal.Instant.compare(bCreated, aCreated)
    })) {
        const headSha = branch.commit?.id
        if (headSha === undefined) {
            continue
        }
        const headCommit = commitMap.get(headSha)

        if (headCommit === undefined) {
            continue
        }
        recursiveAssignLanes(headCommit, commitMap, lanes)
    }

    return commits
}

export const buildCommitGraph = async (event: H3Event) => {
    const repo = event.context.params!.repo!
    const owner = event.context.params!.owner!
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

    const commits = assignLanes(commitMap, branches.data!)

    return {
        branches: branches.data!,
        commits: commits,
    }
}

export const testHelpers = {
    buildCommitGraph,
    linkChildren,
    buildCommitMap,
}
