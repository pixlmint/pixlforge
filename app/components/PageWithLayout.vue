<template>
    <div
        class="content-column-list"
        :style="{
            'grid-template-areas': gridTemplateAreas,
            'grid-template-columns': gridTemplateColumns,
        }"
    >
        <LayoutItemBaseComponentWrapper
            v-for="(component, _) in columns.components"
            :key="component.title"
            :component="component"
            :style="{ 'grid-area': component.gridArea }"
        />
    </div>
</template>

<script lang="ts" setup>
import type { PageWithLayoutColumn } from '~/types'

const { columns } = defineProps<{ columns: PageWithLayoutColumn }>()

const gridTemplateAreas = computed(() => {
    if (typeof columns.gridTemplateAreas === 'string') {
        return `'${columns.gridTemplateAreas}'`
    } else {
        return columns.gridTemplateAreas.map((s) => `'${s}'`).join(' ')
    }
})

const gridTemplateColumns = computed(() => {
    if (typeof columns.columns === 'string') {
        return columns.columns
    } else {
        return columns.columns.join(' ')
    }
})
</script>

<style lang="scss">
@import 'assets/css/mixins';

:root {
    --content-column-width: 50%;
}
.content-column-list {
    display: block;

    @include size-large {
        display: grid;
    }

    .column-item {
        margin: 0.5rem;
        border-top: 2px solid white;

        @include size-large {
            border: 2px solid white;
            background-color: var(--color-bg);
        }

        .item-header,
        .item-content {
            padding: 1rem;
        }

        .item-header {
            display: flex;
            color: var(--color-text);
            border-bottom: 1px solid white;
            text-transform: uppercase;

            h2 {
                margin: 0;
            }
        }
    }
}
</style>
