<template>
    <Navbar :inputRoute="`/${error?.status}`" />
    <div class="page">
        <h2>{{ error?.status }}: {{ error?.message }}</h2>
        <VueJsonPretty v-if="dev" :data="error" />
    </div>
</template>

<script lang="ts" setup>
import type { NuxtError } from '#app'

const VueJsonPretty = defineAsyncComponent(() => import('vue-json-pretty'))

const dev = import.meta.dev

const props = defineProps({
    error: Object as () => NuxtError,
})
</script>
