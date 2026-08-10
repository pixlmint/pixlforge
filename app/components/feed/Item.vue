<template>
    <div class="feed-item">
        <div class="feed-item-content">
            <template
                v-if="
                    ['create_issue', 'close_issue', 'reopen_issue', 'comment_issue'].includes(
                        entry.type,
                    )
                "
            >
                <div class="feed-item-content-header">
                    <div>
                        <component :is="icon" />
                        {{ issueVerb }} Issue
                        <a :href="issueLink" target="_blank">#{{ entry.content!.issueId }}</a> in
                        <nuxt-link :to="`/repos/${entry.repo}`">{{ entry.repo }}</nuxt-link>
                    </div>
                    <timeago class="monospaced" :date="entry.created!" />
                </div>
                <div class="feed-item-content-text">{{ entry.content!.text }}</div>
                <div class="feed-item-content-footer monospaced"></div>
            </template>
            <template v-else-if="entry.type === 'create_repo'">
                <div class="feed-item-content-header">
                    <div>
                        <component :is="icon" />
                        Create Repository
                        <nuxt-link :to="`/repos/${entry.repo}`">{{ entry.repo }}</nuxt-link>
                    </div>
                    <timeago class="monospaced" :date="entry.created!" />
                </div>

                <div class="feed-item-content-footer"></div>
            </template>
            <template v-else>
                {{ entry.type }}
            </template>
        </div>
    </div>
    <vue-json-pretty v-if="debug && isDebugBuild" :data="entry" />
</template>

<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty'
import type { SerializedRecentActivity } from '~~/server/types'
import {
    GoIssueOpened,
    GoIssueClosed,
    GoComment,
    GoAlertFill,
    GoRepo,
    GoIssueReopened,
} from 'vue-icons-plus/go'

const { entry, debug } = defineProps<{ entry: SerializedRecentActivity; debug: boolean }>()

const isDebugBuild = import.meta.env.DEV

const issueLink = computed(
    () =>
        useRuntimeConfig().public.forgejoBaseUrl +
        `/${useRuntimeConfig().public.primaryUser}/${entry.repo}/issues/${entry.content!.issueId}`,
)

const icon = computed(() => {
    let icon = GoAlertFill
    switch (entry.type) {
        case 'create_issue':
            icon = GoIssueOpened
            break
        case 'close_issue':
            icon = GoIssueClosed
            break
        case 'comment_issue':
            icon = GoComment
            break
        case 'create_repo':
            icon = GoRepo
            break
        case 'reopen_issue':
            icon = GoIssueReopened
            break
    }

    return h(icon, {
        width: 15,
        height: 15,
        class: 'feed-item-header-icon',
    })
})

const issueVerb = computed(() => {
    switch (entry.type) {
        case 'create_issue':
            return 'Create'
        case 'close_issue':
            return 'Close'
        case 'reopen_issue':
            return 'Reopen'
        case 'comment_issue':
            return 'Comment on'
    }
})
</script>
