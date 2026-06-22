<template>
    <footer>
        <div class="monospaced">
            version:
            <a
                target="_blank"
                :href="`https://git.pixlmint.ch/pixlmint/pixlforge/commit/${version}`"
                >{{ shortVersion }}</a
            >
        </div>
    </footer>
</template>

<script lang="ts" setup>
const version = useRuntimeConfig().public.version
const shortVersion = version.substring(0, 7)
</script>

<style lang="scss">
footer {
    margin-top: 1rem;
    color: var(--color-secondary);
}
</style>
