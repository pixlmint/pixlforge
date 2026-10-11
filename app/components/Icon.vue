<template>
    <img class="icon" :src="`/img/icons/${icon}.svg`" :alt="icon" />
</template>

<script lang="ts" setup>
const { icon } = defineProps<{ icon: string }>()
</script>
