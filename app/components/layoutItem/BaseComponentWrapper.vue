<template>
    <div class="column-item">
        <div class="item-header monospaced">
            <h2>
                {{ component.title }}
            </h2>
            <div v-if="component.createHeading !== undefined">
                <component :is="component.createHeading()" />
            </div>
        </div>
        <div class="item-content">
            <component :is="actualComponent" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import LayoutItemSyncComponentWrapper from '~/components/layoutItem/SyncComponentWrapper.vue'
import LayoutItemAsyncComponentWrapper from '~/components/layoutItem/AsyncComponentWrapper.vue'
import type { LayoutColumnComponent } from '~/types'

const { component } = defineProps<{ component: LayoutColumnComponent }>()

const actualComponent = computed(() => {
    if (component.loadContent === undefined) {
        return h(LayoutItemSyncComponentWrapper, { component })
    } else {
        // @ts-ignore
        return h(LayoutItemAsyncComponentWrapper, { component })
    }
})
</script>
