<template>
    <div>
        <h2>{{ repo }}</h2>
        <template v-if="data !== undefined && data.readme !== undefined">
            <div v-if="data.readme.html" v-html="data.readme.html" />
            <p v-else-if="data.readme.raw">{{ data.readme.raw }}</p>
            <p v-else>No Readme</p>
        </template>
        <p v-else>No Readme</p>
        <RepoCommitTree v-if="repo !== undefined" :repo="repo" owner="pixlmint" />
        <vue-json-pretty :data="data" />
    </div>
</template>

<script setup lang="ts">
import VueJsonPretty from 'vue-json-pretty'

const route = useRoute()

const repo = computed(() => route.params.repo)

const { data } = await useFetch('/api/repo', {
    query: { repo: route.params.repo },
})
</script>
