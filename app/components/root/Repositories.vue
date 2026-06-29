<template>
    <Table :columnConfiguration="columnConfiguration" :data="repos">
        <template #cell="{ row, col, value }">
            <template v-if="col.member === 'title'">
                <nuxt-link v-if="typeof row.forgeId === 'string'" :to="`/repos/${row.forgeId}`">{{
                    value
                }}</nuxt-link>
                <nuxt-link v-else-if="typeof row.portfolioId === 'string'" :to="row.portfolioId">{{
                    value
                }}</nuxt-link>
            </template>
            <span :class="{ monospaced: col.member === 'tags' }" v-else>{{ value }}</span>
        </template>
    </Table>
</template>

<script lang="ts" setup>
import type { TableColumnConfiguration } from '~/types'
import type { ProjectSearchResult } from '~~/shared/types'

const { repos } = defineProps<{ repos: ProjectSearchResult[] }>()

const columnConfiguration: TableColumnConfiguration[] = [
    {
        width: 'minmax(60px, 0.25fr)',
        member: 'title',
    },
    {
        member: 'description',
        width: 'minmax(180px, 0.5fr)',
        cellClassList: 'data-col-secondary',
    },
    {
        member: 'tags',
        width: 'minmax(80px, 0.25fr)',
        cellClassList: 'data-col-secondary',
    },
]
</script>
