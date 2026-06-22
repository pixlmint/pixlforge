<template>
    <PageWithLayout :columns="columns" />
    <Footer />
</template>

<script lang="ts" setup>
import Feed from '~/components/feed/Index.vue'
import Repositories from '~/components/root/Repositories.vue'
import type { PageWithLayoutColumn } from '~/types'
import { useForgeState } from '~~/composables/states'
const recents = (await useFetch('/api/recent')).data.value!

const forgeState = useForgeState()

onMounted(() => {
    forgeState.value!.viewingRepo = undefined
})

const columns = computed((): PageWithLayoutColumn[] => {
    return [
        {
            width: '70vw',
            components: [
                {
                    title: 'repos',
                    content: h(Repositories, { repos: recents.repos }),
                },
            ],
        },
        {
            width: '30vw',
            components: [
                {
                    title: 'feed',
                    content: h(Feed, { feed: recents.activity }),
                },
            ],
        },
    ]
})
</script>
