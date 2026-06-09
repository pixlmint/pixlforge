<template>
    <div class="feed-item">
        <div class="feed-item-time monospaced">
            <timeago v-if="entry.created" :date="entry.created" />
        </div>
        <div class="feed-item-content">
            <template v-if="entry.type === 'create_issue' || entry.type === 'comment_issue'">
                <div class="feed-item-content-header">
                    <div>Issue</div>
                    <div>-</div>
                    <div>
                        <nuxt-link :to="`/repos/${entry.repo}`">{{ entry.repo }}</nuxt-link>
                    </div>
                </div>
                <div>{{ entry.content!.text }}</div>
                <div class="feed-item-content-footer monospaced">#{{ entry.content!.issueId }}</div>
            </template>
            <!-- XXX: Should commits even show up here? -->
            <template
                v-else-if="
                    (entry.type === 'commit_repo' || entry.type === 'mirror_sync_push') &&
                    entry.content !== undefined &&
                    entry.content.HeadCommit !== undefined &&
                    entry.content.HeadCommit !== null
                "
            >
                <div class="feed-item-content-header">
                    <div>Commit</div>
                    <div>-</div>
                    <div>
                        <nuxt-link :to="`/repos/${entry.repo}`">{{ entry.repo }}</nuxt-link>
                    </div>
                </div>

                <div>{{ entry.content.HeadCommit.Message }}</div>

                <div class="feed-item-content-footer monospaced">
                    <div>{{ entry.refName }}</div>
                </div>
            </template>
            <template v-else-if="entry.type === 'create_repo'">
                <div class="feed-item-content-header">
                    <div>Create Repo</div>
                    <div>-</div>
                    <div>
                        <nuxt-link :to="`/repos/${entry.repo}`">{{ entry.repo }}</nuxt-link>
                    </div>
                </div>

                <div>some description here</div>

                <div class="feed-item-content-footer"></div>
            </template>
        </div>
    </div>
    <vue-json-pretty v-if="debug" :data="entry" />
</template>

<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty'
import type { SerializedRecentActivity } from '~~/server/types'

const { entry, debug } = defineProps<{ entry: SerializedRecentActivity; debug: boolean }>()
</script>
