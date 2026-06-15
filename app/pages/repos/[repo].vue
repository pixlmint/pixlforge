<template>
    <div>
        <h2>{{ repo }}</h2>

        <PageWithLayout :columns="columns" />
    </div>
</template>

<script setup lang="ts">
import CommitTree from '~/components/repo/commit-tree.vue'
import IssueList from '~/components/repo/issue-list.vue'
import Readme from '~/components/repo/readme.vue'
import { useForgeState } from '~~/composables/states'

const route = useRoute()

const repo = computed(() => route.params.repo)

const forgeState = useForgeState()

onMounted(() => {
    forgeState.value!.viewingRepo = repo.value as string
})

const { data } = await useFetch('/api/repo', {
    query: { repo: route.params.repo },
})

const columns = computed(() => {
    if (data.value === undefined) return []

    return [
        {
            width: '70vw',
            components: [
                {
                    title: 'readme',
                    content: h(Readme, { readme: data.value.readme }),
                },
                {
                    title: 'commits',
                    content: h(CommitTree, { commits: data.value.commits }),
                },
            ],
        },
        {
            width: '30vw',
            components: [
                {
                    title: 'issues',
                    content: h(IssueList, { issues: data.value.issues }),
                },
            ],
        },
    ]
})
</script>
