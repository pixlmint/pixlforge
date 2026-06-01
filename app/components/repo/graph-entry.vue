<template>
    <div class="graph-timeline-item">
        {{ timelineIcon }}
    </div>
    <div class="graph-item">
        <div class="graph-icon">
            <span v-if="commit.isMerge">Merge</span>
        </div>
        <div class="commit-sha">
            {{ commit.sha }}
        </div>
        <div v-if="commit.headOf !== undefined" class="branch">
            {{ commit.headOf }}
        </div>
        <div class="commit-message">
            {{ commit.message }}
        </div>
        <div class="commit-timestamp">
            <timeago :date="commit.timestamp" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { HistoryCommit } from '~/types'

const { commit } = defineProps<{ commit: HistoryCommit }>()

const timelineIcon = computed(() => {
    if (commit.isMerge) {
        return '\\'
    } else {
        return '*'
    }
})
</script>

<style lang="scss">
.graph-item {
    display: flex;
    gap: 1rem;
}
</style>
