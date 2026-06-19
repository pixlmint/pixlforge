<template>
    <ContentRenderer v-if="cv" :value="cv" />
</template>

<script lang="ts" setup>
const { data: cv } = useAsyncData('cv-content', () =>
    queryCollection('pages').path('/pages/cv').first(),
)
</script>
