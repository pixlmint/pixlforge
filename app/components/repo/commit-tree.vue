<template>
    <a :href="`https://git.pixlmint.ch/${owner}/${repo}`">{{ owner }}/{{ repo }}</a>

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

    <svg ref="graph"></svg>

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
        <repo-graph-entry v-for="(commit, _) in commits" :key="commit.sha" :commit="commit" />
    </div>
</template>

<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty'
import { repoListBranches, repoGetAllCommits } from '~~/lib/generated'
import { Temporal } from '@js-temporal/polyfill'
import * as d3 from 'd3'
import type { HistoryCommit } from '~/types'

const { owner, repo } = defineProps<{ owner: string; repo: string }>()

const graph = ref(null)

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

type Point = {
    x: number
    y: number
}

const renderGitGraph = (data: HistoryCommit[]) => {
    const width = 800
    const height = data.length * 50
    const margin = { top: 20, right: 150, bottom: 20, left: 50 }

    const svg = d3.select(graph.value)
    svg.selectAll('*').remove() // Clear previous renders
    svg.attr('width', width).attr('height', height)

    // 1. POSITIONING LOGIC (The "Lane" Algorithm)
    // We need to calculate X for every commit
    const lanes: { [key: string]: number } = {} // Map: BranchName -> LaneIndex
    let nextLaneIndex = 0
    const nodePositions = new Map<string, Point>() // Map: SHA -> {x, y}

    // To simplify this demo, we'll use a simplified lane assignment:
    // In a real app, you'd track branch lifecycle (birth/death)
    data.forEach((node, i) => {
        const y = i * 50 + margin.top

        // Assign X based on the first branch name in the node
        // In a real implementation, you'd track which lane the branch currently occupies
        const primaryBranch: string = node.branchNames[0]!
        if (lanes[primaryBranch] === undefined) {
            lanes[primaryBranch] = nextLaneIndex++
        }

        const x = lanes[primaryBranch] * 40 + margin.left
        nodePositions.set(node.sha, { x, y })
    })

    // 2. DRAW LINKS (The "Graph" part)
    // We draw lines from Child -> Parent
    const links: { source?: Point; target?: Point }[] = []
    data.forEach((node) => {
        node.parents.forEach((parentSha) => {
            if (nodePositions.has(node.sha) && nodePositions.has(parentSha)) {
                links.push({
                    source: nodePositions.get(node.sha),
                    target: nodePositions.get(parentSha),
                })
            }
        })
    })

    const linkGen = d3
        .line()
        .curve(d3.curveBasis) // This creates the smooth "Git-style" curves
        .x((d) => d[0])
        .y((d) => d[1])

    // Draw the paths
    svg.selectAll('.link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', (d) => {
            // Create a path that goes from child, curves, to parent
            // return linkGen([d.source, { x: d.source.x, y: d.target.y }, d.target]);
            return linkGen([
                [d.source!.x, d.source!.y],
                [d.source!.x, d.target!.y],
                [d.target!.x, d.target!.y],
            ])
        })

    // 3. DRAW NODES
    const nodes = svg
        .selectAll('.node')
        .data(data)
        .enter()
        .append('g')
        .attr('transform', (d) => {
            const pos = nodePositions.get(d.sha)
            return `translate(${pos!.x}, ${pos!.y})`
        })

    nodes.append('circle').attr('r', 6).attr('class', 'commit-node')

    // 4. DRAW LABELS (Commit Messages)
    nodes
        .append('text')
        .attr('class', 'commit-text')
        .attr('dx', 15)
        .attr('dy', 4)
        .text((d) => `${d.sha.substring(0, 7)} - ${d.message}`)

    // 5. DRAW BRANCH LABELS (The colorful labels on the right)
    const activeBranches = [...new Set(data.flatMap((d) => d.branchNames))]
    svg.selectAll('.branch-label')
        .data(activeBranches)
        .enter()
        .append('text')
        .attr('class', 'branch-label')
        .attr('x', width - margin.right)
        .attr('y', (d, i) => {
            // Find the first occurrence of this branch to place the label
            const firstNode = data.find((n) => n.branchNames.includes(d))
            return nodePositions.get(firstNode!.sha)!.y
        })
        .text((d) => d)
}

onMounted(() => {
    renderGitGraph(commits)
})
</script>

<style lang="scss">
.commit-list {
    display: flex;
}

.commit-graph {
    display: grid;
    grid-template-columns: 20px auto;
}

svg {
    background-color: white;

    .commit-node {
        fill: #555;
    }

    .commit-text {
        font-family: sans-serif;
        font-size: 12px;
        fill: #333;
    }

    .link {
        fill: none;
        stroke: #aaa;
        stroke-width: 2px;
        opacity: 0.6;
    }

    .branch-label {
        font-weight: bold;
        font-size: 10px;
        fill: #007bff;
    }
}
</style>
