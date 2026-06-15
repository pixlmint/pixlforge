<template>
    <template v-if="readme !== undefined">
        <div class="repo-readme" v-if="readme.html" v-html="readme.html" />
        <pre v-else-if="readme.raw">{{ readme.raw }}</pre>
        <p v-else>No Readme</p>
    </template>
    <p v-else>No Readme</p>
</template>

<script lang="ts" setup>
const { readme } = defineProps<{ readme: any }>()
</script>
