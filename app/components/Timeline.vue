<template>
    <ul class="timeline">
        <li class="timeline-item" v-for="(item, index) in timeline" :key="index">
            <div class="item-title" v-if="item.title !== undefined">{{ item.title }}</div>
            <div class="time monospaced">{{ item.time }}</div>
            <p>{{ item.text }}</p>
        </li>
    </ul>
</template>

<script lang="ts" setup>
// component copied and adapted from https://codepen.io/TajShireen/pen/JjGvVzg on 2026-06-18

const { timeline } = defineProps<{ timeline: { time: string; text: string; title?: string }[] }>()
</script>

<style lang="scss">
.timeline,
.timeline-item {
    list-style: none;
    padding: 0;
}

.timeline {
    margin-top: 2rem;
    border-radius: 12px;
    position: relative;

    .timeline-item {
        padding-bottom: 1.5rem;
        position: relative;
        padding-left: 20px;
        margin: 0 0 5px 10px;

        &:last-child {
            border: 0px;
            padding-bottom: 0;
        }

        &:before {
            content: '';
            width: 15px;
            height: 15px;
            border: 2px solid white;
            position: absolute;
            left: -10px;
            top: 0px;
        }

        &:after {
            content: '';
            background-color: white;
            height: calc(100% - 35px);
            width: 2px;
            position: absolute;
            left: -2px;
            top: 30px;
        }

        .item-title {
            font-size: 1.5rem;
            padding-bottom: 1rem;
            line-height: 0.8;
        }

        .time {
            color: var(--color-secondary);
        }

        p {
            line-height: 1.5;
            margin-top: 0.4rem;
        }
    }
}
</style>
