<template>
    <Table :columnConfiguration="columnConfiguration" :data="repos">
        <template #cell="{ row, col, value }">
            <nuxt-link v-if="col.member === 'name'" :to="`/repos/${value}`">{{ value }}</nuxt-link>
            <span :class="{ monospaced: col.member === 'language' }" v-else>{{ value }}</span>
        </template>
    </Table>
</template>

<script lang="ts" setup>
import type { TableColumnConfiguration } from '~/types'
import type { SerializedListedRepo } from '~~/server/types'

const { repos } = defineProps<{ repos: SerializedListedRepo[] }>()

const columnConfiguration: TableColumnConfiguration[] = [
    {
        width: 'minmax(60px, 0.25fr)',
        member: 'name',
    },
    {
        member: 'description',
        width: 'minmax(180px, 0.5fr)',
        cellClassList: 'data-col-secondary',
    },
    {
        member: 'language',
        width: 'minmax(80px, 0.25fr)',
        cellClassList: 'data-col-secondary',
    },
]
</script>
