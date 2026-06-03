import { repoGetAllCommits, repoListBranches } from '~~/lib/generated'
import { Temporal } from '@js-temporal/polyfill'
import type { H3Event } from 'h3'
import type { CommitLane, HistoryCommit } from '~~/shared/types'
import type { Commit, CommitMeta } from '~~/lib/generated'

const historyCommitToCommitMeta = (commit: HistoryCommit): CommitMeta => {
    return {
        created: commit.timestamp,
        sha: commit.sha,
    }
}

const getParentFromSameBranch = (
    childCommit: HistoryCommit,
    commitMap: Map<string, HistoryCommit>,
): HistoryCommit | undefined => {
    const parents = childCommit.parents
        .map((parentMeta) => {
            const parent = commitMap.get(parentMeta.sha)

            if (parent === undefined) {
                console.error('Unable to find parent', parentMeta)
            }

            return parent
        })
        .filter((parent) => parent !== undefined)

    for (const parent of parents) {
        if (
            childCommit.sourceBranch !== undefined &&
            parent.branchNames.includes(childCommit.sourceBranch)
        ) {
            return parent
        }
    }

    console.error(`Unable to find parent of same branch for ${childCommit.sha}`)
}

const getFirstChildOfSameBranch = (
    parentCommit: HistoryCommit,
    commitMap: Map<string, HistoryCommit>,
): HistoryCommit | undefined => {
    const children = parentCommit.children.map((childMeta) => commitMap.get(childMeta.sha)!)

    for (const child of children) {
        if (child.branchNames.includes(parentCommit.sourceBranch!)) {
            return child
        }
    }

    console.error(`Unable to find child of same branch for ${parentCommit.sha}`)
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

const getOrCreateBranchLane = (name: string, lanes: Map<string, CommitLane>): CommitLane => {
    if (!lanes.has(name)) {
        lanes.set(name, {
            id: name,
            name: name,
            isVirtualBranch: false,
        })
    }

    return lanes.get(name)!
}

const recursiveAssignLanes = (
    currentCommit: HistoryCommit,
    commitMap: Map<string, HistoryCommit>,
    lanes: Map<string, CommitLane>,
): void => {
    if (currentCommit.headOf !== undefined) {
        currentCommit.lane = getOrCreateBranchLane(currentCommit.headOf, lanes)
    } else if (currentCommit.branchNames.length === 1) {
        currentCommit.lane = getOrCreateBranchLane(currentCommit.branchNames[0]!, lanes)
    } else if (currentCommit.children.length === 1) {
        const child = commitMap.get(currentCommit.children[0]!.sha)

        if (child !== undefined && child.lane !== undefined) {
            currentCommit.lane = child.lane
        }
    }

    if (currentCommit.children.length > 0) {
        for (const childMeta of currentCommit.children) {
            const child = commitMap.get(childMeta.sha)

            if (child !== undefined && child.lane === undefined) {
                recursiveAssignLanes(child, commitMap, lanes)
            }
        }
    }

    if (currentCommit.parents.length > 0) {
        for (const parentMeta of currentCommit.parents) {
            const parent = commitMap.get(parentMeta.sha)
            if (parent !== undefined) {
                if (currentCommit.parents.length === 1) {
                    if (currentCommit.lane !== undefined) {
                        parent.lane = currentCommit.lane
                    }
                    recursiveAssignLanes(parent, commitMap, lanes)
                } else if (parent.lane === undefined) {
                    recursiveAssignLanes(parent, commitMap, lanes)
                }
            }
        }
    }
}

const assignLanes = (commitMap: Map<string, HistoryCommit>): HistoryCommit[] => {
    // map -> array, sort
    const commits = commitMap
        .values()
        .toArray()
        .sort((a, b) => {
            return Temporal.Instant.compare(a.timestamp, b.timestamp)
        })
        .reverse()

    const lanes = new Map<string, CommitLane>()

    recursiveAssignLanes(commits[0]!, commitMap, lanes)

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

        const head = commitMap.get(branch.commit!.id!)

        if (head !== undefined) {
            head.headOf = branch.name!
        }
    })

    linkChildren(commitMap)

    const commits = assignLanes(commitMap)

    // map -> array, sort
    // const commits = commitMap
    //     .values()
    //     .toArray()
    //     .sort((a, b) => {
    //         return Temporal.Instant.compare(a.timestamp, b.timestamp)
    //     })
    //     .reverse()
    //
    // const lanes = new Map<string, CommitLane>()
    //
    // const getOrCreateBranchLane = (name: string): CommitLane => {
    //     if (!lanes.has(name)) {
    //         lanes.set(name, {
    //             id: name,
    //             name: name,
    //             isVirtualBranch: false,
    //         })
    //     }
    //
    //     return lanes.get(name)!
    // }
    //
    // const createNewLane = (): CommitLane => {
    //     const lane: CommitLane = {
    //         id: 'virtual_' + lanes.size.toString(),
    //         isVirtualBranch: true,
    //     }
    //
    //     lanes.set(lane.id, lane)
    //
    //     return lane
    // }
    //
    // // assign commit lanes
    // commits.forEach((commit) => {
    //     if (commit.lane !== undefined) {
    //         return
    //     } else if (commit.branchNames.length === 0) {
    //         commit.lane = {
    //             id: 'no-branch',
    //             name: 'no-branch',
    //             isVirtualBranch: false,
    //         }
    //     } else if (commit.branchNames.length === 1) {
    //         commit.lane = getOrCreateBranchLane(commit.branchNames[0]!)
    //     } else if (commit.headOf !== undefined) {
    //         commit.lane = getOrCreateBranchLane(commit.headOf)
    //     } else if (commit.children.length === 1) {
    //         const childCommit = commitMap.get(commit.children[0]!.sha)!
    //
    //         if (childCommit.parents.length === 1) {
    //             commit.lane = childCommit.lane
    //         } else if (childCommit.parents.length > 1) {
    //             const siblingCommitSha =
    //                 childCommit.parents[0]!.sha === commit.sha
    //                     ? childCommit.parents[1]!.sha
    //                     : childCommit.parents[0]!.sha
    //
    //             const siblingCommit = commitMap.get(siblingCommitSha)
    //
    //             if (siblingCommit === undefined) {
    //                 return
    //             }
    //
    //             if (Temporal.Instant.compare(commit.timestamp, siblingCommit.timestamp) < 0) {
    //                 commit.lane = childCommit.lane
    //             } else {
    //                 commit.lane = createNewLane()
    //             }
    //         } else {
    //             commit.lane = createNewLane()
    //         }
    //     } else if (commit.children.length === 2) {
    //         const firstChild = commitMap.get(commit.children[0]!.sha)!
    //         const secondChild = commitMap.get(commit.children[1]!.sha)!
    //
    //         const nonMergeCommit = firstChild.parents.length > 1 ? secondChild : firstChild
    //         commit.lane = nonMergeCommit.lane
    //     } else if (commit.children.length > 2) {
    //         const candidates: HistoryCommit[] = commit.children
    //             .map((childMeta) => commitMap.get(childMeta.sha))
    //             .filter((commit) => commit !== undefined && !commit.isMerge) as HistoryCommit[]
    //         const commitBranches = new Set<string>(commit.branchNames)
    //         const badCandidates: string[] = []
    //
    //         candidates.forEach((candidate) => {
    //             const candidateBranches = new Set<string>(candidate.branchNames)
    //
    //             if (candidateBranches.difference(commitBranches).size > 0) {
    //                 badCandidates.push(candidate.sha)
    //             }
    //         })
    //
    //         const cleanedCandidates = candidates.filter(
    //             (candidate) => !badCandidates.includes(candidate.sha),
    //         )
    //
    //         console.log(cleanedCandidates)
    //
    //         if (cleanedCandidates.length === 1) {
    //             commit.lane = cleanedCandidates[0]!.lane
    //         }
    //     }
    // })

    return {
        branches: branches.data!,
        commits: commits,
    }
}

export const testHelpers = {
    getParentFromSameBranch,
    getFirstChildOfSameBranch,
    buildCommitGraph,
    linkChildren,
    buildCommitMap,
}
