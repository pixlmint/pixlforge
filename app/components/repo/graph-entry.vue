<template>
    <div class="graph-item">
        <div class="commit-sha">
            {{ sha }}
        </div>
        <div v-if="commit.headOf !== undefined" class="branch">
            {{ commit.headOf }}
        </div>
        <div class="commit-message">
            {{ message }}
        </div>
        <div class="commit-timestamp">
            <timeago :date="commit.timestamp" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { HistoryCommit } from '#shared/types'

const { commit } = defineProps<{ commit: HistoryCommit }>()

const sha = computed(() => commit.sha.substring(0, 7))

const message = computed(() => commit.message.split('\n')[0] ?? '<no message>')
</script>

<style lang="scss">
.graph-item {
    display: flex;
    gap: 1rem;

    .branch {
        padding: 2px;
        border: 1px solid var(--color-secondary);
        border-radius: 4px;
        line-height: 15px;
    }

    .commit-message {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        max-width: 200px;
    }

    .commit-message {
        white-space: nowrap;
    }

    .commit-sha,
    .commit-timestamp,
    .commit-date {
        color: var(--color-secondary);
        font-family: monospace;
    }
}
</style>
