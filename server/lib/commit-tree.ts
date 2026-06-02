import { repoGetAllCommits, repoListBranches } from '~~/lib/generated'
import { Temporal } from '@js-temporal/polyfill'
import type { H3Event } from 'h3'
import type { HistoryCommit } from '~~/shared/types'
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

const determineSourceBranch = (
    commit: HistoryCommit,
    commitMap: Map<string, HistoryCommit>,
): void => {
    if (commit.sourceBranch !== undefined) {
        return
    }

    if (commit.branchNames.length === 1) {
        commit.sourceBranch = commit.branchNames[0]
        return
    }

    if (commit.parents.length === 0) {
        // we found the very first commit
        commit.sourceBranch = commit.branchNames.includes('main')
            ? 'main'
            : commit.branchNames.includes('master')
              ? 'master'
              : commit.branchNames[0]
        return
    }

    const parents = commit.parents.map((parentMeta) => commitMap.get(parentMeta.sha))
    const helperMap = new Map<Temporal.Instant, string>()

    for (const parent of parents) {
        if (parent === undefined) {
            console.error(`Parent of ${commit.sha} is undefined`, commit, parents)
            continue
        }

        if (parent.sourceBranch === undefined) {
            determineSourceBranch(parent, commitMap)
            if (parent.sourceBranch === undefined) {
                console.error(
                    `Unable to determine source branch for ${parent.sha} (branchNames: ${parent.branchNames})`,
                )
                continue
            }
        }

        helperMap.set(parent.timestamp, parent.sourceBranch)
    }

    console.log(helperMap)

    const sortedDates = helperMap
        .keys()
        .toArray()
        .sort((a, b) => Temporal.Instant.compare(a, b))

    if (sortedDates.length === 0) {
        console.error("No viable branches found? I don't know how this could even happen", commit)
    }

    const earliestDate = sortedDates[0]!

    commit.sourceBranch = helperMap.get(earliestDate)
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
    // const headCommits = new Map<string, string>()

    // branches.data!.forEach((branch) => {
    //     headCommits.set(branch.commit!.id!, branch.name!)
    // })

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
                // if (headCommits.has(commitSha)) {
                //     historyCommit.headOf = headCommits.get(commitSha)!
                // }
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

    linkChildren(commitMap)

    // map -> array, sort
    const commits = commitMap
        .values()
        .toArray()
        .sort((a, b) => {
            return Temporal.Instant.compare(a.timestamp, b.timestamp)
        })
        .reverse()

    commits.forEach((commit) => {
        if (commit.branchNames.length === 1) {
            commit.sourceBranch = commit.branchNames[0]
        }
    })

    // assign source branch for each commit
    commits.forEach((commit) => {
        determineSourceBranch(commit, commitMap)
        if (commit.isMerge) {
            const parent = getParentFromSameBranch(commit, commitMap)

            if (parent !== undefined && parent.children.length > 0) {
                determineSourceBranch(parent, commitMap)
                const firstChild = getFirstChildOfSameBranch(parent, commitMap)

                if (firstChild !== undefined) {
                    let child = firstChild
                    while (child.sha !== commit.sha) {
                        child.sourceBranch = commit.sourceBranch
                        child = getFirstChildOfSameBranch(child, commitMap)!
                    }
                }
            }
        }
    })

    return {
        branches: branches.data!,
        commits: commits,
    }
}

export const testHelpers = {
    getParentFromSameBranch,
    getFirstChildOfSameBranch,
    determineSourceBranch,
    buildCommitGraph,
    linkChildren,
    buildCommitMap,
}
