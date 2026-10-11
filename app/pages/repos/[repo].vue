<template>
    <div>
        <div class="repo-header">
            <h2>{{ repo }}</h2>
            <a
                class="forgejo-link no-blank-arrow"
                :href="forgeLink"
                title="Open in Forgejo"
                target="_blank"
            >
                <Icon icon="forgejo" />
            </a>
            <span>|</span>
            <ul class="tag-list">
                <li class="monospaced" v-for="tag in meta.tags" :key="tag">
                    <NuxtLink :to="`/tech/${tag}`">{{ tag }}</NuxtLink>
                </li>
            </ul>
        </div>

        <PageWithLayout :columns="content" />
    </div>
</template>

<script setup lang="ts">
import CommitTree from '~/components/repo/commit-tree.vue'
import IssueList from '~/components/repo/issue-list.vue'
import ReadmeHead from '~/components/repo/readme-head.vue'
import Readme from '~/components/repo/readme.vue'
import type { PageWithLayoutColumn } from '~/types'
import type { Issue } from '~~/lib/forgejo'
import type { HistoryCommit, RepoReadme } from '~~/shared/types'

const route = useRoute()

const repo = computed(() => route.params.repo)

const forgeLink = computed(() => {
    const baseUrl = useRuntimeConfig().public.forgejoBaseUrl
    const primaryUser = useRuntimeConfig().public.primaryUser

    return `${baseUrl}/${primaryUser}/${repo.value}`
})

useHead({
    title: `${repo.value as string} | pixlforge`,
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
.repo-header {
    display: flex;
    align-items: center;
    gap: 1rem;

    img {
        padding-top: 8px;
    }
}
</style>
