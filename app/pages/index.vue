<template>
    <div>
        <h1>Hello Custom Page</h1>
        <div>
            <RootRepositories :repos="recents.repos" />
            <RootRecentActions :actions="recents.actions" />
            <RootRecentIssues :issues="recents.issues" />
            <RootRecentCommits :commits="recents.commits" />
        </div>
    </div>
</template>

<script lang="ts" setup>
const recents = (await useFetch("/api/recent")).data.value!;
</script>
