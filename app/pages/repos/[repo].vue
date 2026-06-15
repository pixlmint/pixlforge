<template>
    <div>
        <h2>{{ repo }}</h2>
        <div class="content-column-list">
            <div
                class="content-column"
                v-for="(col, index) in columns"
                :key="index"
                :style="`--content-column-width: ${col.width}`"
            >
                <div
                    v-for="(component, _) in col.components"
                    :key="component.title"
                    class="column-item"
                >
                    <div class="item-header monospaced">
                        <div>
                            {{ component.title }}
                        </div>
                    </div>
                    <div class="item-content">
                        <component :is="component.content" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import CommitTree from '~/components/repo/commit-tree.vue'
import IssueList from '~/components/repo/issue-list.vue'
import Readme from '~/components/repo/readme.vue'
import { useForgeState } from '~~/composables/states'

const route = useRoute()

const repo = computed(() => route.params.repo)

const forgeState = useForgeState()

onMounted(() => {
    forgeState.value!.viewingRepo = repo.value as string
})

const { data } = await useFetch('/api/repo', {
    query: { repo: route.params.repo },
})

const columns = computed(() => {
    if (data.value === undefined) return []

    return [
        {
            width: '70vw',
            components: [
                {
                    title: 'readme',
                    content: h(Readme, { readme: data.value.readme }),
                },
                {
                    title: 'commits',
                    content: h(CommitTree, { commits: data.value.commits }),
                },
            ],
        },
        {
            width: '30vw',
            components: [
                {
                    title: 'issues',
                    content: h(IssueList, { issues: data.value.issues }),
                },
            ],
        },
    ]
})
</script>

<style lang="scss">
:root {
    --content-column-width: 50%;
}
.content-column-list {
    display: flex;
    gap: 1rem;

    .content-column {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: var(--content-column-width);

        .column-item {
            border: 2px solid white;

            .item-header,
            .item-content {
                padding: 1rem;
            }

            .item-header {
                display: flex;
                color: var(--color-secondary);
                border-bottom: 1px solid white;
                text-transform: uppercase;
            }
        }
    }
}
</style>
