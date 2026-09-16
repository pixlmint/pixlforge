<template>
    <div class="cv-header">
        <h1>
            {{ text }}
        </h1>

        <div class="headshot" :style="`background-image: url('${image}')`" />
    </div>
</template>

<script lang="ts" setup>
const { text, image } = defineProps<{ text: string; image: string }>()
</script>

<style lang="scss">
.cv-header {
    display: flex;
    max-width: 1200px;
    margin: 0 auto;
    align-items: center;
    justify-content: center;
    gap: 5rem;

    .headshot {
        width: 200px;
        height: 200px;
        border-radius: 100%;
        background-size: cover;
    }
}
</style>
