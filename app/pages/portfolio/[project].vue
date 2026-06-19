<template>
    <h1>{{ project }}</h1>
    <ContentRenderer v-if="data" :value="data" />
</template>

<script lang="ts" setup>
const route = useRoute()
const project = route.params.project

const { data } = await useAsyncData(route.path, () =>
    queryCollection('portfolio').path(route.path).first(),
)
</script>
