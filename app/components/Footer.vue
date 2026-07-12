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
        <div class="monospaced">build date: {{ buildDate }}</div>
    </footer>
</template>

<script lang="ts" setup>
const version = useRuntimeConfig().public.version
const shortVersion = version.substring(0, 7)
const buildDate = useRuntimeConfig().public.buildDate
</script>

<style lang="scss">
footer {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    color: var(--color-secondary);
}
</style>
