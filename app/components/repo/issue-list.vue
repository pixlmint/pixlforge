<template>
    <div class="issue-list">
        <div v-for="(issue, _) in issues" :key="issue.id" class="issue-list-item">
            <input type="checkbox" disabled :checked="issue.state !== 'open'" />
            <div class="issue-number">#{{ issue.id }}</div>
            <div>
                {{ issue.title }}
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { issueListIssues } from '~~/lib/generated'

const { repo, owner } = defineProps<{ repo: string; owner: string }>()

const issues = (
    await issueListIssues({
        path: { owner, repo },
        query: { limit: 25, state: 'all', sort: 'latest' },
    })
).data!
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
