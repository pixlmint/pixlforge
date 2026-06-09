<template>
    <div class="header monospaced">
        <div class="breadcrumbs">
            <div class="breadcumb-item breadcumb-root">
                <nuxt-link to="/">Home</nuxt-link>
            </div>
            <template v-for="(el, index) in route" :key="index">
                <div class="breadcrumb-separator">/</div>
                <div
                    :class="{ 'current-page': index + 1 === route.length, 'breadcrumb-item': true }"
                >
                    {{ el }}
                </div>
            </template>
        </div>
        <div>
            <a :href="forgejoUrl" title="Open Forgejo" target="_blank">
                <img src="assets/img/forgejo-icon.svg" width="20" height="20" />
            </a>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useForgeState } from '~~/composables/states'

const forgeState = useForgeState()

const forgejoUrl = computed(() => {
    const base = 'https://git.pixlmint.ch'
    if (forgeState.value === undefined || forgeState.value.viewingRepo === undefined) {
        return base
    }

    return `${base}/pixlmint/${forgeState.value.viewingRepo}`
})

const route = computed(() => {
    return useRoute()
        .path.trim()
        .replace(/^\/+|\/+$/g, '')
        .split('/')
})
</script>

<style lang="scss">
.header {
    display: flex;
    justify-content: space-between;

    .breadcrumbs {
        display: flex;
        gap: 4px;

        .breadcrumb-separator {
            color: var(--color-secondary);
        }

        .breadcrumb-item {
            &:not(.current-page) {
                color: var(--color-secondary);
            }
        }
    }
}
</style>
