<template>
    <h1>{{ technology }}</h1>

    <div class="card-list">
        <NuxtLink
            class="page-card"
            v-for="(page, index) in projects"
            :key="index"
            :to="
                page.forgeId === undefined || page.forgeId === null
                    ? `${page.portfolioId}`
                    : `/repos/${page.forgeId}`
            "
        >
            <h2 class="monospaced">{{ page.title }}</h2>
            {{ page }}
        </NuxtLink>
    </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const technology = route.params.technology! as string

const response = await useFetch('/api/project/search', {
    query: { technology: technology, order: 'latestUpdate' },
})

if (response.error.value) console.error(response.error.value)

const projects = response.data!.value
</script>

<style lang="scss">
.card-list {
    display: flex;
    gap: 5px;

    .page-card {
        max-width: 25%;
        padding: 1rem;
        border: 2px solid white;
    }
}
</style>
