<template>
    <div :title="dt">{{ timeAgo }}</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { Temporal } from '@js-temporal/polyfill';

const props = defineProps({
    date: {
        type: [String, Date, Object],
        required: true,
    }
});

function toInstant(d: unknown): Temporal.Instant {
    if (typeof d === 'string') return Temporal.Instant.from(d);
    if (d instanceof Date) return Temporal.Instant.fromEpochMilliseconds(d.getTime());
    if (d instanceof Temporal.ZonedDateTime) return d.toInstant();
    return d as Temporal.Instant;
}

const instant = computed(() => toInstant(props.date));

const timeAgo = ref('');

watch(() => props.date, (a, b) => {
    if (toInstant(a).epochMilliseconds !== toInstant(b).epochMilliseconds) {
        updateTimeAgo();
        updateInterval();
    }
});

function formatRelative(inst: Temporal.Instant): string {
    const now = Temporal.Now.instant();
    const secs = inst.until(now).total('seconds');
    const abs = Math.abs(secs);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (abs < 3600)    return rtf.format(-Math.round(secs / 60), 'minute');
    if (abs < 86400)   return rtf.format(-Math.round(secs / 3600), 'hour');
    if (abs < 2592000) return rtf.format(-Math.round(secs / 86400), 'day');
    if (abs < 31536000) return rtf.format(-Math.round(secs / 2592000), 'month');
    return rtf.format(-Math.round(secs / 31536000), 'year');
}

function updateTimeAgo() {
    const now = Temporal.Now.instant();
    const diffMs = Math.abs(instant.value.until(now).total('milliseconds'));
    if (diffMs <= 15 * 1000) {
        timeAgo.value = 'just now';
    } else if (diffMs < 60 * 1000) {
        timeAgo.value = '< 1 minute ago';
    } else {
        timeAgo.value = formatRelative(instant.value);
    }
    updateInterval();
}

function getUpdateInterval(): number {
    const now = Temporal.Now.instant();
    const diffMinutes = Math.abs(instant.value.until(now).total('minutes'));
    if (diffMinutes < 0.5) return 2 * 1000;
    if (diffMinutes < 1)   return 5 * 1000;
    if (diffMinutes < 5)   return 30 * 1000;
    if (diffMinutes < 60)  return 60 * 1000;
    return 300 * 1000;
}

let intervalId: ReturnType<typeof setInterval> | null = null;

function updateInterval() {
    if (intervalId !== null) clearInterval(intervalId);
    intervalId = setInterval(updateTimeAgo, getUpdateInterval());
}

onMounted(() => {
    updateTimeAgo();
});

onUnmounted(() => {
    if (intervalId !== null) clearInterval(intervalId);
});

const dt = computed(() => {
    const tz = Temporal.Now.timeZoneId();
    const zdt = instant.value.toZonedDateTimeISO(tz);
    const now = Temporal.Now.zonedDateTimeISO(tz);
    const dayDiff = now.toPlainDate().until(zdt.toPlainDate()).total('days');
    const roundedDayDiff = Math.round(dayDiff);
    if (Math.abs(dayDiff) < 2) {
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        const cld = rtf.format(roundedDayDiff, 'day');
        const timeStr = `${String(zdt.hour).padStart(2, '0')}:${String(zdt.minute).padStart(2, '0')}:${String(zdt.second).padStart(2, '0')}`;
        return cld.charAt(0).toUpperCase() + cld.slice(1) + ', ' + timeStr;
    }
    const d = String(zdt.day).padStart(2, '0');
    const m = String(zdt.month).padStart(2, '0');
    const h = String(zdt.hour).padStart(2, '0');
    const min = String(zdt.minute).padStart(2, '0');
    const s = String(zdt.second).padStart(2, '0');
    return `${d}.${m}.${zdt.year} ${h}:${min}:${s}`;
});
</script>
