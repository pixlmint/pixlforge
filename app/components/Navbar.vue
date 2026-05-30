<template>
    <div class="header">
        <span>
            <nuxt-link to="/">Home</nuxt-link>
        </span>
        <span v-for="el, index in route" :key="index">
            / {{ el }}
        </span>
    </div>
</template>

<script lang="ts" setup>
const route = computed(() => {
    return useRoute().path.trim().split('/')
});
</script>
