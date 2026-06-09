<template>
    <div>
        <h2>{{ repo }}</h2>
        <template v-if="readme !== undefined">
            <div v-if="readme.html" v-html="readme.html" />
            <p v-else-if="readme.raw">{{ readme.raw }}</p>
            <p v-else>No Readme</p>
        </template>
        <p v-else>No Readme</p>
        <RepoIssueList v-if="issues !== undefined" :issues="issues" />
        <RepoCommitTree v-if="commits !== undefined" :commits="commits" />
    </div>
</template>

<script setup lang="ts">
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

const meta = computed(() => (data.value !== undefined ? data.value.meta : undefined))
const issues = computed(() => (data.value !== undefined ? data.value.issues : undefined))
const commits = computed(() => (data.value !== undefined ? data.value.commits : undefined))
const readme = computed(() => (data.value !== undefined ? data.value.readme : undefined))
</script>
