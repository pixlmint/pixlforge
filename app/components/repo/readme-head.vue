<template>
    <button v-if="readme.portfolio" @click="toggleReadmeMode">toggle</button>
</template>

<script lang="ts" setup>
import type { RepoReadme } from '~~/shared/types'

const { readme } = defineProps<{ readme: RepoReadme }>()

const readmeMode = inject<Ref<boolean>>('readmeModeState')

const toggleReadmeMode = () => {
    if (readmeMode === undefined) {
        console.error('undefined')
    } else {
        readmeMode.value = !readmeMode.value
    }
}
</script>
