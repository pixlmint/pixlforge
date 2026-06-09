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

    <div class="commit-history-graph" :style="`--commit-history-item-height: ${LANE_HEIGHT}px`">
        <svg ref="graph"></svg>
        <div class="commit-history-labels">
            <repo-graph-entry
                class="commit-history-label-item"
                v-for="(commit, _) in commits"
                :key="commit.sha"
                :commit="commit"
            />
        </div>
    </div>

    <details>
        <summary>Raw</summary>
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
                        :class="{
                            active: viewingCommit !== null && viewingCommit.sha === commit.sha,
                        }"
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
    </details>
</template>

<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty'
import * as d3 from 'd3'
import type { HistoryCommit } from '~~/shared/types'

const { owner, repo } = defineProps<{ owner: string; repo: string }>()

const { branches, commits } = (await useFetch(`/api/${owner}/${repo}/commit-tree`)).data!.value!

const columns = new Array(Math.max(...commits.map((commit) => commit.column!)) + 1)

const graph = ref(null)

const LANE_HEIGHT = 24 // 24px per lane
const LANE_WIDTH = 15 // 10px per lane

const viewingCommit = ref<HistoryCommit | null>(null)

type Point = {
    x: number
    y: number
}

const renderGitGraph = (data: HistoryCommit[]) => {
    const height = data.length * LANE_HEIGHT
    const margin = { top: LANE_HEIGHT / 2, right: LANE_WIDTH / 2, bottom: 20, left: LANE_WIDTH / 2 }
    const width = LANE_WIDTH * 2 * (Math.max(...data.map((commit) => commit.column ?? 0)) + 1)

    const svg = d3.select(graph.value)
    svg.selectAll('*').remove() // Clear previous renders
    svg.attr('width', width).attr('height', height)

    // 1. POSITIONING LOGIC (The "Lane" Algorithm)
    // We need to calculate X for every commit
    const nodePositions = new Map<string, Point>() // Map: SHA -> {x, y}

    data.forEach((node, i) => {
        const y = i * LANE_HEIGHT + margin.top
        const x = (node.column ?? 0) * LANE_WIDTH + margin.left
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
}

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
    background-color: transparent;

    .commit-node {
        fill: #555;
    }

    .link {
        stroke: #aaa;
        stroke-width: 2px;
        opacity: 0.6;
        fill: #555;
    }
}
:root {
    --commit-history-item-height: 10px;
}
.commit-history-graph {
    display: flex;
    gap: 5px;

    .commit-history-labels {
        .commit-history-label-item {
            line-height: var(--commit-history-item-height);
            height: var(--commit-history-item-height);
        }
    }
}
</style>
