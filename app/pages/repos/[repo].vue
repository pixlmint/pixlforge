<template>
    <div>
        <h2>{{ repo }}</h2>

        <PageWithLayout :columns="columns" />
    </div>
</template>

<script setup lang="ts">
import CommitTree from '~/components/repo/commit-tree.vue'
import IssueList from '~/components/repo/issue-list.vue'
import ReadmeHead from '~/components/repo/readme-head.vue'
import Readme from '~/components/repo/readme.vue'
import { useForgeState } from '~~/composables/states'
import type { Issue } from '~~/lib/forgejo'
import type { HistoryCommit, RepoReadme } from '~~/shared/types'

const route = useRoute()

const repo = computed(() => route.params.repo)

const forgeState = useForgeState()

onMounted(() => {
    forgeState.value!.viewingRepo = repo.value as string
})

const readmeResponse = await useFetch('/api/repo/readme', { query: { repo: repo.value } })
const readme = readmeResponse.data!.value as RepoReadme
const contentUsingReadmeMode = ref(readme.portfolio !== null && readme.portfolio !== undefined)
provide('readmeModeState', contentUsingReadmeMode)

const columns = [
    {
        width: '70vw',
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
            },
            {
                title: 'commits',
                loadContent: () =>
                    useFetch('/api/repo/commitGraph', {
                        query: { repo: repo.value },
                        server: false,
                    }),
                createComponent: (commits: HistoryCommit[]) => h(CommitTree, { commits }),
            },
        ],
    },
    {
        width: '30vw',
        components: [
            {
                title: 'issues',
                loadContent: () =>
                    useFetch('/api/repo/latestIssues', {
                        query: { repo: repo.value },
                        server: false,
                    }),
                createComponent: (issues: Issue[]) => h(IssueList, { issues }),
            },
        ],
    },
]
// })
</script>
