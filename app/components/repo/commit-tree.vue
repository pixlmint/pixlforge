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

    <details>
        <summary>commit example</summary>
        <!-- <VueJsonPretty :data="branchCommits[0]!.commits[0]" /> -->
    </details>

    <h2>Commits</h2>

    <!-- <details> -->
    <!--     <summary>mermaid</summary> -->
    <!--     <pre>{{ mermaidGitGraph }}</pre> -->
    <!--     <repo-mermaid-diagram :value="mermaidGitGraph" /> -->
    <!-- </details> -->
    <details>
        <summary>SVG</summary>
        <svg ref="graph"></svg>
    </details>

    <div class="commit-list-split">
        <table class="commit-list">
            <thead>
                <tr>
                    <th class="rotate" v-for="(_, index) in columns" :key="index">
                        <div>
                            <!-- <span>{{ id }}</span> -->
                        </div>
                    </th>
                    <th>info</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(commit, _) in commits"
                    :key="commit.sha"
                    :class="{ active: viewingCommit !== null && viewingCommit.sha === commit.sha }"
                >
                    <td v-for="(_, index) in columns" :key="index">
                        <span v-if="commit.column === index">
                            <template v-if="commit.isMerge"> \ </template>
                            <template v-else> * </template>
                        </span>
                        <span v-else> | </span>
                    </td>
                    <td class="commit-info" @click="viewingCommit = commit">
                        <span class="commit-sha">{{ commit.sha.substring(0, 7) }}</span>
                        <span class="commit-message">{{ commit.message.split('\n')[0]! }}</span>
                        <span class="commit-date">
                            <!-- <timeago :date="commit.timestamp" /> -->
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="commit-detail">
            <vue-json-pretty
                class="commit-detail-content"
                v-if="viewingCommit !== null"
                :data="viewingCommit"
            />
        </div>
    </div>
    <div class="commit-graph">
        <repo-graph-entry v-for="(commit, _) in commits" :key="commit.sha" :commit="commit" />
    </div>
</template>

<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty'
import * as d3 from 'd3'
import type { HistoryCommit } from '~~/shared/types'

const { owner, repo } = defineProps<{ owner: string; repo: string }>()

const { branches, commits } = (await useFetch(`/api/${owner}/${repo}/commit-tree`)).data!.value!

const columns = new Array(Math.max(...commits.map((commit) => commit.column!)) + 1)

const graph = ref(null)

const viewingCommit = ref<HistoryCommit | null>(null)

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
        node.parents.forEach((parentMeta) => {
            if (nodePositions.has(node.sha) && nodePositions.has(parentMeta.sha)) {
                links.push({
                    source: nodePositions.get(node.sha),
                    target: nodePositions.get(parentMeta.sha),
                })
            }
        })
    })

    const linkGen = d3
        .line()
        // .curve(d3.curveBasis) // This creates the smooth "Git-style" curves
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
                // [d.source!.x, d.target!.y],
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

const buildMermaidGitGraph = (data: HistoryCommit[]): string[] => {
    const gitGraph = ['---', 'title: GitGraph', '---', 'gitGraph BT:']

    const gitActions: string[] = []

    let currentBranch: string | undefined
    let previousBranch: string | undefined

    const registeredBranches = new Set<string>()

    data.reverse().forEach((commit) => {
        if (currentBranch === undefined) {
            currentBranch = commit.branchNames[0]!
            registeredBranches.add(currentBranch)
            if (currentBranch !== 'main') {
                gitActions.push(`branch ${currentBranch}`)
            }
            gitActions.push(`checkout ${currentBranch}`)
        }

        if (currentBranch !== commit.branchNames[0]!) {
            previousBranch = currentBranch
            if (currentBranch === commit.branchNames[0]) {
                currentBranch = commit.branchNames[1]!
            } else {
                currentBranch = commit.branchNames[0]!
            }

            if (!registeredBranches.has(currentBranch) && currentBranch !== 'main') {
                registeredBranches.add(currentBranch)
                gitActions.push(`branch ${currentBranch}`)
            }

            gitActions.push(`checkout ${currentBranch}`)
        }

        if (commit.isMerge && previousBranch !== undefined) {
            gitActions.push(`merge ${previousBranch}`)
        }

        gitActions.push(`commit id: "${commit.sha.trim()}"`)
    })

    return [...gitGraph, ...gitActions.map((row) => `    ${row}`)]
}

// const mermaidGitGraph = buildMermaidGitGraph(commits).join('\n')

onMounted(() => {
    renderGitGraph(commits)
})
</script>

<style lang="scss">
// .commit-list {
//     display: flex;
// }

.commit-graph {
    display: grid;
    grid-template-columns: 20px auto;
}

.commit-list-split {
    display: flex;

    table.commit-list {
        width: 75%;

        .commit-info {
            span {
                margin: 0 5px;
            }

            .commit-sha,
            .commit-date {
                color: var(--color-secondary);
            }
        }

        th {
            position: sticky;
            top: 0;
            background-color: black;
        }

        tr.active td {
            background-color: #222;
        }

        // th.rotate {
        //     /* Something you can count on */
        //     height: 250px;
        //     white-space: nowrap;
        // }
        //
        // th.rotate > div {
        //     transform:
        //         /* Magic Numbers */ translate(0px, 105px)
        //         /* 45 is really 360 - 45 */ rotate(270deg);
        //     width: 30px;
        // }
        //
        // th.rotate > div > span {
        //     border-bottom: 1px solid #ccc;
        //     padding: 5px 10px;
        // }
    }

    .commit-detail {
        width: 25%;

        .commit-detail-content {
            position: sticky;
            top: 0;
        }
    }
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

    .link {
        fill: #555;
    }
}
</style>
