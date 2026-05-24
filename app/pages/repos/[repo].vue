<template>
    <div>
        repo: {{repo}}
    </div>

</template>

<script setup lang="ts">
const route = useRoute();

const repo = computed(() => route.params.repo);
</script>
