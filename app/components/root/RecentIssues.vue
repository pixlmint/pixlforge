<template>
    <h2>Recent Issues</h2>
    <ul v-for="issue, index in issues" :key="index">
        <li v-for="value, k in issue" :key="k">
            {{ k }}: {{ value }}
        </li>
    </ul>
</template>

<script lang="ts" setup>
import type { SerializedRecentIssue } from '~~/server/types';
const { issues } = defineProps<{ issues: SerializedRecentIssue[] }>();
</script>
