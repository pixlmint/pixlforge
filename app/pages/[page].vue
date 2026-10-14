<template>
    <ContentRenderer class="content-page" v-if="pageContent" :value="pageContent" />
</template>

<script lang="ts" setup>
const route = useRoute()

const page = route.params.page

const { data: pageContent, pending } = useAsyncData(`${page}-content`, () =>
    queryCollection('pages').path(`/pages/${page}`).first(),
)

watch(pending, async (isPending: boolean) => {
    if (isPending) {
        return
    }
    if (!pageContent.value) {
        throw createError({
            status: 404,
            statusText: 'Page not found',
            fatal: true,
        })
    } else {
        useHead({
            title: `${pageContent.value.title} | pixlforge`,
            meta: [{ name: 'description', content: pageContent.value.description }],
        })
    }
})
</script>
