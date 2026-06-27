<template>
    <component :is="component.content" />
</template>

<script lang="ts" setup>
import type { LayoutColumnComponent } from '~/types'

const { component } = defineProps<{ component: LayoutColumnComponent }>()
</script>
