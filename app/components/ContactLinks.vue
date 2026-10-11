<template>
    <div class="contact-links">
        <a
            v-for="{ url, content, icon } in links"
            :key="url"
            class="link no-blank-arrow"
            :href="url"
            target="_blank"
        >
            <Icon class="contact-icon" v-if="icon" :icon="icon" />{{ content }}
        </a>
    </div>
</template>

<script lang="ts" setup>
const { links } = defineProps<{ links: { url: string; content: string; icon?: string }[] }>()
</script>

<style lang="scss">
.contact-links {
    display: flex;
    justify-content: center;
    gap: 1rem;

    .link {
        text-decoration: none;
        color: var(--color-text);
        padding: 0.5rem;
        border: 1px solid var(--color-text);
        display: flex;
        align-items: center;
        gap: 4px;

        &:visited {
            color: var(--color-text);
        }

        .contact-icon {
            height: 1rem;
        }
    }
}
</style>
