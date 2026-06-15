<template>
    <input type="checkbox" v-model="debug" />
    <div class="feed" v-for="(entry, index) in feed" :key="index">
        <FeedItem :entry="entry" :debug="debug" />
    </div>
</template>
<script lang="ts" setup>
import type { SerializedRecentActivity } from '~~/server/types'

const { feed } = defineProps<{ feed: SerializedRecentActivity[] }>()

const debug = ref(false)
</script>
