<template>
    <div v-for="i in lines ?? 1" :class="['base-skeleton', size]"></div>
</template>

<script lang="ts" setup>
const { size, lines } = defineProps<{ size: 'heading' | 'text' | 'circle'; lines?: number }>()
</script>

<style lang="scss">
.base-skeleton {
    background: linear-gradient(90deg, #abc 30%, #dcdcdc 50%, #abc 70%);
    background-size: 400%;
    animation: shimmer 1.5s infinite linear;

    border-radius: 1rem;
    height: 1rem;
    margin-bottom: 0.2rem;

    &.circle {
        border-radius: 50%;
    }
}

@keyframes shimmer {
    0% {
        background-position: 100% 100%;
    }
    100% {
        background-position: 0 0;
    }
}
</style>
