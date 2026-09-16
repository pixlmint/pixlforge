<template>
    <template v-if="props.mode === 'text'">
        <div
            v-for="i in props.lines"
            :class="`skeleton skeleton-text skeleton-level__${props.headingLevel}`"
            :style="`width: ${props.width}%`"
        ></div>
    </template>
    <template v-else-if="props.mode === 'image'">
        <div class="skeleton skeleton-image" :style="`height: ${props.imgHeight ?? '100px'}`"></div>
    </template>
</template>

<script lang="ts" setup>
interface Props {
    lines?: number
    mode?: 'text' | 'image'
    headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    width?: number
    imgHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
    mode: 'text',
    lines: 1,
    width: 100,
})
</script>

<style lang="scss" scoped>
.skeleton {
    display: block;
    animation: skeleton-loading 1s linear infinite alternate;
}

@keyframes skeleton-loading {
    0% {
        background-color: hsl(200, 20%, 80%);
    }
    100% {
        background-color: hsl(200, 20%, 95%);
    }
}

.product-image {
    width: 100%;
    height: 160px;
    background: linear-gradient(135deg, #f5f7fa, #e3e6f0);
    position: relative;
    overflow: hidden;
}

.product-image::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
    transform: translateX(-100%);
    animation: shimmer 2s infinite;
}

.skeleton-image {
    width: 100%;
}

.skeleton-text {
    width: 100%;
    height: 0.7rem;
    margin-bottom: 0.5rem;
    border-radius: 0.25rem;
}

.skeleton-level__h1 {
    height: 2em;
}

.skeleton-level__h2 {
    height: 1.5em;
}

.skeleton-level__h3 {
    height: 1.17em;
}

.skeleton-level__h4 {
    height: 1em;
}

.skeleton-level__h5 {
    height: 0.83em;
}

.skeleton-level__h5 {
    height: 0.67em;
}
</style>
