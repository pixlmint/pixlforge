<template>
    <div class="writeup-page">
        <div class="writeup-header">
            <h2>{{ project }}</h2>
            <ul class="tag-list">
                <li class="monospaced" v-if="data" v-for="tag in data.tags" :key="tag">
                    <NuxtLink :to="`/tech/${tag}`">{{ tag }}</NuxtLink>
                </li>
            </ul>
        </div>

        <ContentRenderer class="writeup-content" v-if="data" :value="data" />
    </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const project = route.params.project

const { data } = await useAsyncData(route.path, () =>
    queryCollection('portfolio').path(route.path).first(),
)
</script>

<style lang="scss">
@use 'assets/css/mixins' as *;

.writeup-page {
    margin: 0.5rem auto;
    border-top: 2px solid white;
    max-width: 700px;

    @include size-large {
        border: 2px solid white;
        background-color: var(--color-bg);
    }

    .writeup-header {
        display: flex;
        border-bottom: 1px solid white;
        justify-content: space-between;
        align-items: center;
        padding: 0 1rem;

        .tag-list {
            margin: 0;
        }
    }

    .writeup-content {
        padding: 0 1rem;

        img {
            max-width: 100%;
        }
    }
}
</style>
