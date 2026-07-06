<template>
    <component v-if="!pending" :is="create" />
    <span class="monospaced color-secondary" v-else>Loading...</span>
</template>

<script lang="ts" setup>
import type { AsyncLayoutColumnComponent } from '~/types'

const { component } = defineProps<{ component: AsyncLayoutColumnComponent }>()

const { data, pending } = component.loadContent()

const content = computed(() => (pending.value ? null : data.value))
const create = computed(() => component.createComponent!(content.value))
</script>
