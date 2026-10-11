<template>
    <ContentRenderer class="content-page" v-if="pageContent" :value="pageContent" />
</template>

<script lang="ts" setup>
const route = useRoute()

const page = route.path.trim().replaceAll('/', '')

const { data: pageContent } = useAsyncData(`${page}-content`, () =>
    queryCollection('pages').path(`/pages/${page}`).first(),
)

if (pageContent.value) {
    useHead({
        title: `${pageContent.value?.title} | pixlforge`,
        meta: [{ name: 'description', content: pageContent.value?.description }],
    })
} else {
    throw createError({
        status: 404,
        statusText: 'Page not found',
    })
}
</script>
