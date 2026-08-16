<template>
    <h1>{{ technology }}</h1>

    <div class="card-list">
        <ProjectCard v-for="(page, index) in projects" :key="index" :project="page" />
    </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const technology = route.params.technology! as string

const response = await useFetch('/api/project/search', {
    method: 'POST',
    body: {
        filter: {
            field: 'tags',
            operator: 'in',
            value: technology,
        },
    },
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
        text-decoration: none;
        color: var(--color-text);
    }
}
</style>
