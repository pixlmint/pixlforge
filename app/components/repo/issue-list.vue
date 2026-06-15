<template>
    <div class="issue-list">
        <div v-for="(issue, _) in issues" :key="issue.id" class="issue-list-item">
            <Checkbox :checked="issue.state !== 'open'" />
            <input type="checkbox" disabled :checked="issue.state !== 'open'" />
            <div class="issue-number">#{{ issue.number }}</div>
            <div>
                {{ issue.title }}
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { Issue } from '~~/lib/generated'

const { issues } = defineProps<{ issues: Issue[] }>()
</script>

<style lang="scss">
.issue-list {
    .issue-list-item {
        display: flex;
        gap: 5px;

        .issue-number {
            font-family: monospace;
            color: var(--color-secondary);
        }
    }
}
</style>
