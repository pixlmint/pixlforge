<template>
    <NuxtLink :href="props.href" :target="target">
        <slot />
    </NuxtLink>
</template>

<script setup lang="ts">
// component adapted from https://github.com/nuxt-content/mdc/blob/main/src/runtime/components/prose/ProseA.vue
import type { PropType } from 'vue'

// copied from https://regex101.com/r/3fYy3x/1 on 2026-08-21
const domainRegex =
    /(?:http[s]?:\/\/.)?(?:www\.)?[-a-zA-Z0-9@%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/

const props = defineProps({
    href: {
        type: String,
        default: '',
    },
    target: {
        type: String as PropType<
            '_blank' | '_parent' | '_self' | '_top' | (string & object) | null | undefined
        >,
        default: undefined,
        required: false,
    },
})

const target = computed(() => {
    if (props.target) {
        return props.target
    } else {
        const match = domainRegex.exec(props.href)

        if (match) {
            return '_blank'
        }
    }
})
</script>
