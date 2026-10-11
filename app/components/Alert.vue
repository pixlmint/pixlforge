<template>
    <div :class="`alert ${level}`"><Icon :title="level" :icon="level" /><slot /></div>
</template>

<script lang="ts" setup>
const { level } = defineProps<{ level: 'info' | 'error' | 'warning' }>()
</script>

<style lang="scss">
.alert {
    margin: 0.25rem 0;
    padding: 1rem 0.5rem;
    color: var(--color-text);
    border: 1px solid var(--color-text);
    display: flex;
    gap: 4px;
    align-items: center;

    &.info {
        background-color: rgba(34, 35, 108, 0.5);
    }
    &.warning {
        background-color: rgba(156, 142, 71, 0.5);
    }
    &.error {
        background-color: rgba(104, 35, 41, 0.5);
    }

    p {
        margin: 0;
    }

    img.icon {
        height: 1rem;
    }
}
</style>
