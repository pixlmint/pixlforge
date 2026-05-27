<template>
    <div>
        <h2>{{repo}}</h2>
        <vue-json-pretty :data="data" />
    </div>

</template>

<script setup lang="ts">
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

const route = useRoute();

const repo = computed(() => route.params.repo);

const { data } = await useFetch('/api/recent')
</script>
