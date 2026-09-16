<template>
    <div class="card-list">
        <ProjectCard
            v-if="entriesLoaded"
            v-for="(entry, index) in entries"
            :key="index"
            :project="entry"
        />
        <SkeletonProjectCard
            v-else
            v-for="(entryId, loadingIndex) in entryIds"
            :key="loadingIndex"
        />
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

const entries = ref<(SerializedProjectSearchResult | BasicFeaturedProject)[]>([])
const entriesLoaded = ref<boolean>(false)
const orFilter = entryIds.map((entryId) => {
    return { field: 'title', operator: 'eq', value: entryId }
})

useFetch('/api/project/search', {
    method: 'POST',
    body: {
        filter: {
            or: orFilter,
        },
    },
}).then((entriesResponse) => {
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

    entriesLoaded.value = true
})
</script>
