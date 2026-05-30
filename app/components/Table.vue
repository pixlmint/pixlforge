<template>
    <div class="data-list" :style="dataListStyleVars">
        <div class="data-row" v-for="row, index in data" :key="index" :style="dataRowStyleVars">
            <div class="data-entry" v-for="col, cIndex in columnConfiguration" :index="cIndex" :class="col.cellClassList ?? ''">
                <slot name="cell" :row="row" :col="col" :value="row[col.member]">
                    {{ row[col.member] }}
                </slot>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { TableColumnConfiguration } from '~/types';

const { data, columnConfiguration } = defineProps<{
    data: any[],
    columnConfiguration: TableColumnConfiguration[],
}>()


const createColumnVars = () => {
    const normalized = columnConfiguration
        .map(conf => {
            if (conf.width !== undefined) {
                return conf.width
            } else {
                return 'auto';
            }
        })

    const ret = {} as any

    normalized.forEach((element, index) => {
        ret[`--col-${index}-width`] = element;
    });

    return ret;
}

const dataListStyleVars = computed(() => {
    return {
        ...createColumnVars()
    }
})

const dataRowStyleVars = computed(() => {
    return {
        gridTemplateColumns: Array.from(Array(columnConfiguration.length).keys()).map(num => `var(--col-${num}-width)`).join(' '),
    }
})
</script>

<style lang="scss"></style>
