<template>
    <div :style="{ 'margin-top': mt }"></div>
</template>

<script lang="ts" setup>
const { mt } = defineProps<{ mt: string }>()
</script>

<style lang="scss">
.section-separator {
    margin-top: 3rem;
}
</style>
