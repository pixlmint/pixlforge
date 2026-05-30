<template>
    <div>
        <RootRepositories :repos="recents.repos" />
        <Feed :feed="recents.activity" />
        <!-- <RootRecentActions :actions="recents.actions" /> -->
        <!-- <RootRecentIssues :issues="recents.issues" /> -->
        <!-- <RootRecentCommits :commits="recents.commits" /> -->
    </div>
</template>

<script lang="ts" setup>
const recents = (await useFetch("/api/recent")).data.value!;
</script>
