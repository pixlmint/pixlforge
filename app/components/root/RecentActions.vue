<template>
    <h2>Recent Actions</h2>
    <ul v-for="action, index in actions" :key="index">
        <li v-for="value, k in action" :key="k">
            {{ k }}: {{ value }}
        </li>
    </ul>
</template>

<script lang="ts" setup>
import type { SerializedRecentAction } from '~~/server/types';

const { actions } = defineProps<{ actions: SerializedRecentAction[] }>();
</script>
