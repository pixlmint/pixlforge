<template>
    <div class="card-list">
        <ProjectCard v-for="(entry, index) in entries" :key="index" :project="entry" />
    </div>
</template>

<script lang="ts" setup>
import type { SerializedProjectSearchResult } from '~~/shared/types'

type BasicFeaturedProject = {
    title: string
    target: string
    description?: string
    lastChanged?: string
    thumbnail?: string
}

const { entries: entryIds } = defineProps<{ entries: (string | BasicFeaturedProject)[] }>()

const orFilter = entryIds.map((entryId) => {
    return { field: 'title', operator: 'eq', value: entryId }
})

const entriesResponse = await useFetch('/api/project/search', {
    method: 'POST',
    body: {
        filter: {
            or: orFilter,
        },
    },
    server: false,
})

let entries = ref<(SerializedProjectSearchResult | BasicFeaturedProject)[]>([])

entryIds.forEach((entryId) => {
    if (typeof entryId === 'string') {
        for (const entry of entriesResponse.data!.value!) {
            if (entry.title.toLowerCase() === entryId.toLowerCase()) {
                entries.value.push(entry)
            }
        }
    } else {
        entries.value.push(entryId)
    }
})
</script>
