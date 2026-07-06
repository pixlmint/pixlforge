<template>
    <PageWithLayout :columns="content" />
</template>

<script lang="ts" setup>
import Feed from '~/components/feed/Index.vue'
import Repositories from '~/components/root/Repositories.vue'
import type { PageWithLayoutColumn } from '~/types'
import { useForgeState } from '~~/composables/states'

const forgeState = useForgeState()

onMounted(() => {
    forgeState.value!.viewingRepo = undefined
})

const { data: recentRepos } = await useFetch('/api/recent/repos')

const content: PageWithLayoutColumn = {
    columns: ['calc(100vw - max(300px, 30vw) - 2rem)', 'max(300px, 30vw)'],
    gridTemplateAreas: ['repos issues'],
    components: [
        {
            title: 'repos',
            content: h(Repositories, { repos: recentRepos.value }),
            gridArea: 'repos',
        },
        {
            title: 'feed',
            loadContent: () => useFetch('/api/recent/activity'),
            createComponent: (activity: any) => h(Feed, { feed: activity }),
            gridArea: 'issues',
        },
    ],
}
</script>
