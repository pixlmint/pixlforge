<template>
    <div class="header monospaced">
        <div class="breadcrumbs">
            <nuxt-link class="breadcumb-item breadcrumb-root" to="/"
                ><Icon icon="house"
            /></nuxt-link>
            <template v-for="(el, index) in route" :key="index">
                <div class="breadcrumb-separator">/</div>
                <div
                    :class="{ 'current-page': index + 1 === route.length, 'breadcrumb-item': true }"
                >
                    {{ el }}
                </div>
            </template>
        </div>
        <div class="navlinks">
            <NuxtLink to="/cv">CV</NuxtLink>
        </div>
    </div>
</template>

<script lang="ts" setup>
const { inputRoute } = defineProps<{ inputRoute?: string }>()

const route = computed(() =>
    (inputRoute ?? useRoute().path)
        .trim()
        .replace(/^\/+|\/+$/g, '')
        .split('/'),
)
</script>

<style lang="scss">
.header {
    display: flex;
    justify-content: space-between;

    .breadcrumbs {
        display: flex;
        gap: 4px;
        align-items: center;

        .breadcrumb-separator {
            color: var(--color-secondary);
        }

        .breadcrumb-item {
            &:not(.current-page) {
                color: var(--color-secondary);
            }
        }
    }

    .navlinks {
        display: flex;
        gap: 0.5rem;
    }

    .forgejo-link img,
    .breadcrumb-root img {
        height: 1rem;
    }

    a {
        padding: 2px 5px;
        color: var(--color-text);
    }

    a:visited {
        color: var(--color-text);
    }
}
</style>
