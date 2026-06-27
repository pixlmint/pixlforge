<template>
    <PageWithLayout :columns="columns" />
    <Footer />
</template>

<script lang="ts" setup>
import Feed from '~/components/feed/Index.vue'
import Repositories from '~/components/root/Repositories.vue'
import { useForgeState } from '~~/composables/states'

const forgeState = useForgeState()

onMounted(() => {
    forgeState.value!.viewingRepo = undefined
})

const { data: recentRepos } = await useFetch('/api/recent/repos')

const columns = [
    {
        width: '70vw',
        components: [
            {
                title: 'repos',
                content: h(Repositories, { repos: recentRepos.value }),
            },
        ],
    },
    {
        width: '30vw',
        components: [
            {
                title: 'feed',
                loadContent: () => useFetch('/api/recent/activity'),
                createComponent: (activity: any) => h(Feed, { feed: activity }),
            },
        ],
    },
]
</script>
