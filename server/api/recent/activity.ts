import { getCombinedRepositoryFeed, parseActivityContent } from "../feed"
import { ActivityEntry, ActivityType } from "~~/server/types";


const HOME_TYPES: Set<ActivityType> = new Set([
    'commit_repo',
    'close_issue',
    'create_issue',
    'reopen_issue',
    'comment_issue',
    'mirror_sync_push',
    'create_repo',
]);

export const getActivity = async (): Promise<ActivityEntry[]> => {
    const feed = await getCombinedRepositoryFeed(activity => {
        if (!HOME_TYPES.has(activity.op_type!)) {
            return false;
        }
        if (['mirror_sync_push', 'commit_repo'].includes(activity.op_type!)) {
            return activity.content?.HeadCommit !== undefined && activity.content.HeadCommit !== null
        }

        return true;
    });

    return feed.map(entry => {
        return {
            user: entry.act_user!.login!,
            repo: entry.repo!.name!,
            refName: entry.ref_name,
            isPrivate: entry.is_private ?? false,
            content: parseActivityContent(entry) ?? undefined,
            created: entry.created,
            type: entry.op_type!,
        }
    })
}

export default defineEventHandler(() => {
    return getActivity();
})
