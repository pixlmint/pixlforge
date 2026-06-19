<template>
    <ul class="skill-list">
        <li v-for="(skill, index) in skills" :key="index">
            <NuxtLink v-if="skill.createLink === true" :to="`/tech/${skill.tech}`">
                <Icon :icon="skill.tech" />
            </NuxtLink>
            <Icon v-else :icon="skill.tech" />
        </li>
    </ul>
</template>

<script lang="ts" setup>
type Skill = { tech: string; title?: string; createLink?: boolean; icon?: string }
const { skills } = defineProps<{ skills: Skill[] }>()
</script>

<style lang="scss">
.skill-list {
    display: flex;
    gap: 10px;

    li {
        list-style: none;
        display: block;
        border: 2px solid white;
        padding: 10px;
        width: 50px;
        height: 50px;

        img {
            max-width: 100%;
        }
    }
}
</style>
