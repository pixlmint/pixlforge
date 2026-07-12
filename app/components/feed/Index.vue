<template>
    <input v-if="isDebugBuild" type="checkbox" v-model="debugModeActive" />
    <div class="feed" v-for="(entry, index) in feed" :key="index">
        <FeedItem :entry="entry" :debug="debug" />
    </div>
</template>
<script lang="ts" setup>
import type { SerializedRecentActivity } from '~~/server/types'

const { feed } = defineProps<{ feed: SerializedRecentActivity[] }>()

const isDebugBuild = import.meta.env.DEV

const debugModeActive = ref(false)

const debug = computed(() => isDebugBuild && debugModeActive.value)
</script>
