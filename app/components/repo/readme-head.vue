<template>
    <div v-if="readme.portfolio" class="readme-writeup-toggle-switch">
        <button @click="toggleReadmeMode">readme.md</button>
        <button @click="toggleReadmeMode" :class="{ toggle: true, toggled: readmeMode }"></button>
        <button @click="toggleReadmeMode">writeup</button>
    </div>
</template>

<script lang="ts" setup>
import type { RepoReadme } from '~~/shared/types'

const { readme } = defineProps<{ readme: RepoReadme }>()

const readmeMode = inject<Ref<boolean>>('readmeModeState')

const toggleReadmeMode = () => {
    if (readmeMode === undefined) {
        console.error('undefined')
    } else {
        readmeMode.value = !readmeMode.value
    }
}
</script>

<style lang="scss">
$switchHeight: 10px;
$switchBorder: 1px;
$switchToggleGap: 1px;
$switchWidth: $switchHeight * 2;
$toggleHeight: $switchHeight - (2 * ($switchBorder + $switchToggleGap));
$toggleLeftPosition: $switchToggleGap;
$toggleRightPosition: $switchWidth - $switchToggleGap - $toggleHeight - 2 * $switchBorder;

.readme-writeup-toggle-switch {
    display: flex;
    gap: 5px;
    align-items: center;

    .toggle {
        display: block;
        width: $switchWidth;
        height: $switchHeight;
        border: $switchBorder solid white;
        position: relative;
        padding: 0;

        &::before {
            display: block;
            content: '';
            position: absolute;
            top: $switchToggleGap;
            left: $toggleLeftPosition;
            background-color: white;
            width: $toggleHeight;
            height: $toggleHeight;
            transition: left 0.1s linear;
        }

        &.toggled::before {
            left: $toggleRightPosition;
        }
    }

    button {
        border: none;

        &:active {
            background-color: transparent;
        }
    }
}
</style>
