<template>
    <div>
        <h2>{{ repo }}</h2>

        <ul class="tag-list">
            <li class="monospaced" v-for="tag in meta.tags" :key="tag">
                <NuxtLink :to="`/tech/${tag}`">{{ tag }}</NuxtLink>
            </li>
        </ul>

        <PageWithLayout :columns="content" />
    </div>
</template>

<script setup lang="ts">
import CommitTree from '~/components/repo/commit-tree.vue'
import IssueList from '~/components/repo/issue-list.vue'
import ReadmeHead from '~/components/repo/readme-head.vue'
import Readme from '~/components/repo/readme.vue'
import type { PageWithLayoutColumn } from '~/types'
import { useForgeState } from '~~/composables/states'
import type { Issue } from '~~/lib/forgejo'
import type { HistoryCommit, RepoReadme } from '~~/shared/types'

const route = useRoute()

const repo = computed(() => route.params.repo)

const forgeState = useForgeState()

onMounted(() => {
    forgeState.value!.viewingRepo = repo.value as string
})

const repoBaseResponse = await useFetch('/api/repo/base', { query: { repo: repo.value } })
const readme = repoBaseResponse.data!.value.readme as RepoReadme
const meta = repoBaseResponse.data!.value.meta
const contentUsingReadmeMode = ref(readme.portfolio !== null && readme.portfolio !== undefined)
provide('readmeModeState', contentUsingReadmeMode)

const content: PageWithLayoutColumn = {
    columns: ['calc(100vw - max(300px, 30vw) - 2rem)', 'max(300px, 30vw)'],
    gridTemplateAreas: ['readme issues', 'commits .'],
    components: [
        {
            title: 'readme',
            createHeading: () =>
                h(ReadmeHead, {
                    readme: readme,
                }),
            content: h(Readme, {
                readme: readme,
            }),
            columnIndex: 0,
            gridArea: 'readme',
        },
        {
            title: 'issues',
            loadContent: () =>
                useFetch('/api/repo/latestIssues', {
                    query: { repo: repo.value },
                    server: false,
                }),
            createComponent: (issues: Issue[]) => h(IssueList, { issues }),
            columnIndex: 1,
            gridArea: 'issues',
        },
        {
            title: 'commits',
            loadContent: () =>
                useFetch('/api/repo/commitGraph', {
                    query: { repo: repo.value },
                    server: false,
                }),
            createComponent: (commits: HistoryCommit[]) => h(CommitTree, { commits }),
            columnIndex: 0,
            gridArea: 'commits',
        },
    ],
}
</script>

<style lang="scss">
ul.tag-list {
    list-style-type: none;
    display: flex;
    gap: 0.5rem;
    padding-left: 0;

    li {
        display: block;

        a {
            text-decoration: none;
            padding: 0.2rem;
            border: 1px solid var(--color-border);
            color: var(--color-secondary);
        }
    }
}
</style>
