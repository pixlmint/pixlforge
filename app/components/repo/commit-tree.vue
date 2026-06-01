<template>
    <a :href="`https://git.pixlmint.ch/${owner}/${repo}`"
        >{{ owner }}/{{ repo }}</a
    >

    <h2>Branches</h2>
    <ul>
        <li v-for="(branch, index) in branches.data" :key="index">
            <ul>
                <li>Name: {{ branch.name }}</li>
                <li v-if="branch.commit !== undefined">
                    <ul>
                        <li>sha: {{ branch.commit.id }}</li>
                        <li>message: {{ branch.commit.message }}</li>
                        <li>timestamp: {{ branch.commit.timestamp }}</li>
                    </ul>
                </li>
            </ul>
        </li>
    </ul>

    <VueJsonPretty :data="branchCommits[0]!.commits[0]" />

    <h2>Commits</h2>
    <table>
        <thead>
            <tr>
                <th v-for="(branch, index) in branches.data!" :key="index">
                    {{ branch.name }}
                </th>
                <th>info</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(commit, _) in commits" :key="commit.sha">
                <td v-for="(branch, index) in branches.data!" :key="index">
                    <span v-if="commit.branchNames.includes(branch.name!)">
                        <template v-if="commit.isMerge"> \ </template>
                        <template v-else> * </template>
                    </span>
                    <span v-else> | </span>
                </td>
                <td>
                    {{ commit.sha }}
                    {{ commit.message }}
                </td>
            </tr>
        </tbody>
    </table>
    <div class="commit-graph">
        <repo-graph-entry
            v-for="(commit, _) in commits"
            :key="commit.sha"
            :commit="commit"
        />
    </div>
</template>

<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty'
import { repoListBranches, repoGetAllCommits } from '~~/lib/generated'
import { Temporal } from '@js-temporal/polyfill'
import type { HistoryCommit } from '~/types'

const { owner, repo } = defineProps<{ owner: string; repo: string }>()

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
    .reverse()

console.log(commits)
</script>

<style lang="scss">
.commit-list {
    display: flex;
}

.commit-graph {
    display: grid;
    grid-template-columns: 20px auto;
}
</style>
