<template>
    <ContentRenderer v-if="cv" :value="cv" />
</template>

<script lang="ts" setup>
const { data: cv } = useAsyncData('cv-content', () =>
    queryCollection('content').path('/cv').first(),
)
</script>
