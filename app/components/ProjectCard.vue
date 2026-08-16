<template>
    <NuxtLink
        class="page-card"
        :to="
            project.forgeId === undefined || project.forgeId === null
                ? `${project.portfolioId}`
                : `/repos/${project.forgeId}`
        "
    >
        <h2 class="monospaced">{{ project.title }}</h2>
        <p v-if="project.description">
            {{ snippet }}
        </p>
        {{ project }}
    </NuxtLink>
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
