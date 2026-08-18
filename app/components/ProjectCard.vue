<template>
    <NuxtLink
        v-if="isTargetInternal"
        class="page-card"
        :to="
            project.forgeId === undefined || project.forgeId === null
                ? `${project.portfolioId}`
                : `/repos/${project.forgeId}`
        "
    >
        <ProjectCardContent :project="project" />
    </NuxtLink>
    <a v-else class="page-card" :href="project.target">
        <ProjectCardContent :project="project" />
    </a>
</template>

<script lang="ts" setup>
import type { SerializedProjectSearchResult } from '~~/shared/types'

const { project } = defineProps<{ project: SerializedProjectSearchResult }>()

const isTargetInternal = computed(() => project.target === undefined)
</script>
