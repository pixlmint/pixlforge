<template>
    <div
        class="commit-history-graph"
        :style="`--commit-history-item-height: ${LANE_HEIGHT}px; --commit-svg-width: ${graphWidth}px`"
    >
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
</template>

<script lang="ts" setup>
import * as d3 from 'd3'
import type { HistoryCommit } from '~~/shared/types'

const { commits } = defineProps<{ commits: HistoryCommit[] }>()

const graph = ref(null)
const graphWidth = ref(0)

const LANE_HEIGHT = 48 // 24px per lane
const LANE_WIDTH = 15 // 10px per lane

type Point = {
    x: number
    y: number
}

const renderGitGraph = (data: HistoryCommit[]) => {
    const height = data.length * LANE_HEIGHT
    const margin = { top: LANE_HEIGHT / 2, right: LANE_WIDTH / 2, bottom: 20, left: LANE_WIDTH / 2 }
    graphWidth.value = LANE_WIDTH * 2 * (Math.max(...data.map((commit) => commit.column ?? 0)) + 1)

    const svg = d3.select(graph.value)
    svg.selectAll('*').remove() // Clear previous renders
    svg.attr('width', graphWidth.value).attr('height', height)

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
:root {
    --commit-history-item-height: 10px;
    --commit-svg-width: 10px;
}

.commit-history-graph {
    display: flex;
    gap: 5px;

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

    .commit-history-labels {
        .commit-history-label-item {
            line-height: calc(var(--commit-history-item-height) / 2 - 5px);
            height: var(--commit-history-item-height);
            width: calc(var(--content-column-width) - max(var(--commit-svg-width), 60px) - 2rem);
        }
    }
}
</style>
