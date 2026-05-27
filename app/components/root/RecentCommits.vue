<template>
    <h2>Recent Commits</h2>
    <ul v-for="commit, index in commits" :key="index">
        <li v-for="value, k in commit" :key="k">
            {{ k }}: {{ value }}
        </li>
    </ul>
</template>

<script lang="ts" setup>
import type { SerializedRecentCommit } from '~~/server/types';

const { commits } = defineProps<{ commits: SerializedRecentCommit[] }>();
</script>
