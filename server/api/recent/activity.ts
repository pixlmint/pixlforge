import { Activity } from '~~/lib/forgejo'
import { getCombinedRepositoryFeed, parseActivityContent } from '../feed'
import type { ActivityEntry, ActivityType } from '~~/server/types'

const HOME_TYPES: Set<ActivityType> = new Set([
    'commit_repo',
    'close_issue',
    'create_issue',
    'reopen_issue',
    'comment_issue',
    'mirror_sync_push',
    'create_repo',
])

const createActivityIdentifier = (activity: Activity): string => {
    switch (activity.op_type!) {
        case 'reopen_issue':
        case 'close_issue':
        case 'create_issue':
            const issueContent = JSON.parse(activity.content!)
            return 'issue-' + issueContent[0]
        case 'comment_issue':
            return `comment-${activity.comment_id!}`
        case 'create_repo':
            return `repo-${activity.repo_id!}`
    }

    throw new Error('IDK how to deal with ' + activity.op_type!)
}

export const getActivity = async (): Promise<ActivityEntry[]> => {
    const feed = await getCombinedRepositoryFeed((activity) => {
        if (!HOME_TYPES.has(activity.op_type!)) {
            return false
        }
        if (['mirror_sync_push', 'commit_repo'].includes(activity.op_type!)) {
            return (
                activity.content?.HeadCommit !== undefined && activity.content.HeadCommit !== null
            )
        }

        return true
    })

    const outputActivities = {} as Record<string, Activity>

    feed.forEach((activity) => {
        const id = createActivityIdentifier(activity)
        if (!(id in outputActivities)) {
            outputActivities[id] = activity
            outputActivities[id]!.content = parseActivityContent(activity)
        } else {
            if (activity.op_type! === 'create_issue') {
                outputActivities[id]!.content!.text = parseActivityContent(activity)!.text
            }
        }
    })

    return Object.values(outputActivities).map((entry) => {
        return {
            user: entry.act_user!.login!,
            repo: entry.repo!.name!,
            refName: entry.ref_name,
            isPrivate: entry.is_private ?? false,
            content: entry.content!,
            // originalActivity: entry,
            created: entry.created,
            type: entry.op_type!,
        }
    })
}

export default defineEventHandler(() => {
    return getActivity()
})
