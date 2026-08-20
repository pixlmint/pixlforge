<template>
    <NuxtImg :src="src" :width="width" :height="height" :alt="alt" />
</template>

<script lang="ts" setup>
const props = defineProps({
    src: {
        type: String,
    },
    alt: {
        type: String,
        default: '',
    },
    width: {
        type: [String, Number],
        default: undefined,
    },
    height: {
        type: [String, Number],
        default: undefined,
    },
})
</script>
