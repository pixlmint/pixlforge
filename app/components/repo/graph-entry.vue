<template>
    <div class="graph-item">
        <div class="graph-item-row">
            <div class="commit-sha monospaced">
                {{ sha }}
            </div>
            <div class="commit-timestamp monospaced">
                <timeago :date="commit.timestamp" />
            </div>
            <div v-if="commit.headOf !== undefined" class="branch monospaced">
                {{ commit.headOf }}
            </div>
        </div>
        <div class="graph-item-row">
            <div class="commit-message">
                {{ message }}
            </div>
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
    .graph-item-row {
        display: flex;
        gap: 1rem;
    }

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
    }

    .commit-message {
        white-space: nowrap;
    }

    .commit-sha,
    .commit-timestamp,
    .commit-date {
        color: var(--color-secondary);
    }
}
</style>
