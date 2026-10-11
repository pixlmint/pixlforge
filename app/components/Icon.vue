<template>
    <img class="icon" :src="`/img/icons/${icon}.svg`" :alt="icon" />
</template>

<script lang="ts" setup>
const { icon } = defineProps<{ icon: string }>()
</script>

<style lang="scss" scoped>
.icon {
    height: 1rem;
}
</style>
