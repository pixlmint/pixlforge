<template>
    <template v-if="readme !== undefined">
        <template v-if="usingReadmeMode">
            <ContentRenderer :value="readme.portfolio" />
        </template>
        <template v-else>
            <div class="repo-readme" v-if="readme.html" v-html="readme.html" />
            <pre v-else-if="readme.raw">{{ readme.raw }}</pre>
            <p v-else>No Readme</p>
        </template>
    </template>
    <p v-else>No Readme</p>
</template>

<script lang="ts" setup>
import type { RepoReadme } from '~~/shared/types'

const { readme } = defineProps<{
    readme: RepoReadme
}>()

const usingReadmeMode = inject<Ref<boolean>>('readmeModeState')
</script>
