import type { Activity, Comment } from '~~/lib/forgejo'
import type { Serialize } from '~~/shared/types'

import { Temporal } from '@js-temporal/polyfill'
import { getActions } from './api/recent/actions'
import { getIssues } from './api/recent/issues'
import { getRepos } from './api/recent/repos'
import { getCommits } from './api/recent/commits'
import { getActivity } from './api/recent/activity'

type AwaitedReturnTypeList<T> = Awaited<ReturnType<T>>[number]

export type ActivityType =
    | 'create_repo'
    | 'rename_repo'
    | 'star_repo'
    | 'watch_repo'
    | 'commit_repo'
    | 'create_issue'
    | 'create_pull_request'
    | 'transfer_repo'
    | 'push_tag'
    | 'comment_issue'
    | 'merge_pull_request'
    | 'close_issue'
    | 'reopen_issue'
    | 'close_pull_request'
    | 'reopen_pull_request'
    | 'delete_tag'
    | 'delete_branch'
    | 'mirror_sync_push'
    | 'mirror_sync_create'
    | 'mirror_sync_delete'
    | 'approve_pull_request'
    | 'reject_pull_request'
    | 'comment_pull'
    | 'publish_release'
    | 'pull_review_dismissed'
    | 'pull_request_ready_for_review'
    | 'auto_merge_pull_request'

export type IssueContent = {
    issueId: number
    text: string
}

export type CommitContent = {
    Sha1: string
    Message: string
    AuthorEmail: string
    AuthorName: string
    Signature?: string | null
    Verification?: string | null
    CommitterEmail: string
    CommitterName: string
    Timestamp: string
}

export type FeedCommitEntryContent = {
    Commits: CommitContent[]
    HeadCommit: CommitContent | null
    CompareURL: string
    Len: number
}

export type ActivityContent =
    | FeedCommitEntryContent
    | IssueContent
    | [string, string]
    | { issueId: number; text: string }

export type ActivityEntry = {
    user: string
    repo: string
    refName?: string
    isPrivate: boolean
    content?: ActivityContent
    created?: string
    type: ActivityType
}

export type RecentAction = AwaitedReturnTypeList<typeof getActions>
export type SerializedRecentAction = Serialize<RecentAction>

export type RecentIssue = AwaitedReturnTypeList<typeof getIssues>
export type SerializedRecentIssue = Serialize<RecentIssue>

export type ListedRepo = AwaitedReturnTypeList<typeof getRepos>
export type SerializedListedRepo = Serialize<ListedRepo>

export type RecentCommit = AwaitedReturnTypeList<typeof getCommits>
export type SerializedRecentCommit = Serialize<RecentCommit>

export type RecentActivity = AwaitedReturnTypeList<typeof getActivity>
export type SerializedRecentActivity = Serialize<RecentActivity>

export type QueryOperator = 'eq' | 'ge' | 'le' | 'gt' | 'lt'
export type ListQueryOperator = 'in' | 'nin' | 'any' | 'all' | 'eq'

type BaseProjectFilter = {
    value?: any
    and?: ProjectFilter[]
    or?: ProjectFilter[]
}

export type ProjectFilter =
    | (BaseProjectFilter & {
          field?: 'tags'
          operator?: 'in' | 'nin'
      })
    | (BaseProjectFilter & {
          field?: 'tags'
          operator?: 'any' | 'all' | 'eq'
      })
    | (BaseProjectFilter & {
          field?: 'latestUpdate' | 'lastUsed' | 'archived'
          operator?: QueryOperator
      })

export type OrderConfig = {
    field: 'technology' | 'latestUpdate' | 'lastUsedFrecency' | 'lastUsed' | 'title'
    direction?: 'asc' | 'desc'
}

export type SearchOptions = {
    filter?: ProjectFilter
    order?: OrderConfig
}
