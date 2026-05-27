<template>
    <h2>Recent Repos</h2>
    <div v-for="repo, index in repos" :key="index">
        name: {{ repo.name }}
        <br>
        last updated at: {{ repo.updatedAt }}
    </div>
</template>

<script lang="ts" setup>
import type { SerializedListedRepo } from '~~/server/types';

const { repos } = defineProps<{ repos: SerializedListedRepo[] }>();
</script>
