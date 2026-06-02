import { repoGetAllCommits, repoListBranches } from '~~/lib/generated'
import { Temporal } from '@js-temporal/polyfill'
import type { H3Event } from 'h3'
import type { HistoryCommit } from '~~/shared/types'

export default defineCachedEventHandler(
    async (event) => {
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

        const commitMap = new Map<string, HistoryCommit>()
        const headCommits = new Map<string, string>()

        branches.data!.forEach((branch) => {
            headCommits.set(branch.commit!.id!, branch.name!)
        })

        branchCommits.forEach((branch) => {
            branch.commits.forEach((commit) => {
                const commitSha = commit.sha!
                if (!commitMap.has(commitSha)) {
                    let commitMessage
                    if (
                        commit.commit === undefined ||
                        commit.commit.message === undefined ||
                        commit.commit.message === null
                    ) {
                        commitMessage = '<empty>'
                    } else {
                        commitMessage = commit.commit.message
                    }
                    const historyCommit: HistoryCommit = {
                        sha: commitSha,
                        author: commit.committer?.login || '<empty>',
                        parents: commit.parents || [],
                        timestamp: Temporal.Instant.from(commit.created!),
                        branchNames: [],
                        isMerge: (commit.parents || []).length > 1,
                        message: commitMessage,
                    }
                    if (headCommits.has(commitSha)) {
                        historyCommit.headOf = headCommits.get(commitSha)!
                    }
                    commitMap.set(commitSha, historyCommit)
                }
                const node = commitMap.get(commitSha)!
                if (!node.branchNames.includes(branch.branch)) {
                    node.branchNames.push(branch.branch)
                }
            })
        })

        const commits = commitMap
            .values()
            .toArray()
            .sort((a, b) => {
                return Temporal.Instant.compare(a.timestamp, b.timestamp)
            })

        return {
            branches: branches.data!,
            commits: commits,
        }
    },
    {
        maxAge: 60 * 60 * 5,
        getKey: (event: H3Event) =>
            `commits_${event.context.params!.owner}_${event.context.params!.repo}_v2`,
    },
)
