<template>
    <div ref="root">{{ finalValue }}</div>
</template>

<script setup lang="ts">
import mermaid, { type MermaidConfig, type ParseErrorFunction } from 'mermaid'
import { nanoid } from 'nanoid'
import { computed, nextTick, onMounted, watch } from 'vue'

// downloaded on 2026-06-01 from https://github.com/dword-design/vue-mermaid-string/blob/master/src/index.vue

type MermaidError = Parameters<ParseErrorFunction>[0]

declare global {
    interface Window {
        [key: `mermaidClick_${string}`]: (nodeId: string) => void
    }
}

const props = withDefaults(defineProps<{ options?: MermaidConfig; value: string }>(), {
    options: () => ({}),
})

const emit = defineEmits<{
    'parse-error': [error: MermaidError]
    rendered: []
}>()

const id = nanoid()
const root = ref(null)
const finalValue = computed(() => props.value)
const allData = computed(() => [finalValue.value, id])

onMounted(() => {
    if (globalThis.window === undefined) {
        return
    }

    mermaid.initialize({
        securityLevel: 'strict',
        startOnLoad: false,
        theme: 'default',
        ...props.options,
    })
    mermaid.run({
        nodes: [root.value],
        postRenderCallback: () => emit('rendered'),
    })
})

// watch(
//     finalValue,
//     async () => {
//         if (globalThis.window === undefined) {
//             return;
//         }
//
//         if (!finalValue.value) {
//             return;
//         }
//
//         await nextTick(async () => {
//             if (!root.value) {
//                 return;
//             }
//
//             delete root.value.dataset.processed;
//             mermaid.parseError = error => emit('parse-error', error);
//
//             try {
//                 await mermaid.run({
//                     nodes: [root.value],
//                     postRenderCallback: () => emit('rendered'),
//                 });
//             } catch {
//                 // Mermaid will throw the error although the parseError function is set
//             }
//         });
//     },
//     { flush: 'post', immediate: true },
// );
</script>
