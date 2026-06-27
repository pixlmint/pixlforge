<template>
    <div class="content-column-list">
        <div
            class="content-column"
            v-for="(col, index) in columns"
            :key="index"
            :style="`--content-column-width: ${col.width}`"
        >
            <LayoutItemBaseComponentWrapper
                v-for="(component, _) in col.components"
                :key="component.title"
                :component="component"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { PageWithLayoutColumn } from '~/types'

const { columns } = defineProps<{ columns: PageWithLayoutColumn[] }>()
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
            background-color: var(--color-bg);

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
}
</style>
