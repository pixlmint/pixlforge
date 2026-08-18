<template>
    <span
        class="card-thumbnail"
        v-if="project.thumbnail"
        :style="`background-image: url(${project.thumbnail})`"
    />
    <span class="card-body">
        <h2 class="monospaced">{{ project.title }}</h2>
        <p v-if="project.description">
            {{ snippet }}
        </p>
    </span>
</template>

<script lang="ts" setup>
import type { SerializedProjectSearchResult } from '~~/shared/types'

const { project } = defineProps<{ project: SerializedProjectSearchResult }>()

const EXCERPT_MAX_CHARS = 70

const snippet = computed(() => {
    if (project.description) {
        if (project.description.length > EXCERPT_MAX_CHARS) {
            return project.description.substring(0, EXCERPT_MAX_CHARS)
        } else {
            return project.description
        }
    } else {
        return null
    }
})
</script>
