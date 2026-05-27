import { repoListActivityFeeds, userListRepos } from "~~/lib/generated";
import { Temporal } from "@js-temporal/polyfill";

type ActivityType = 'create_repo' | 'rename_repo' | 'star_repo' | 'watch_repo' | 'commit_repo' | 'create_issue' | 'create_pull_request' | 'transfer_repo' | 'push_tag' | 'comment_issue' | 'merge_pull_request' | 'close_issue' | 'reopen_issue' | 'close_pull_request' | 'reopen_pull_request' | 'delete_tag' | 'delete_branch' | 'mirror_sync_push' | 'mirror_sync_create' | 'mirror_sync_delete' | 'approve_pull_request' | 'reject_pull_request' | 'comment_pull' | 'publish_release' | 'pull_review_dismissed' | 'pull_request_ready_for_review' | 'auto_merge_pull_request';

export const getCombinedRepositoryFeed = async (op_types?: ActivityType[]) => {
    const repos = await userListRepos({ path: { username: "pixlmint" }, query: { limit: 500 } });

    if (repos.error) {
        throw repos.error.message;
    }

    const reposActivitiesPromises = repos.data.map(async (repo) => {
        const feed = await repoListActivityFeeds({ path: { owner: "pixlmint", repo: repo.name! } })

        if (feed.error) {
            throw feed.error.message;
        }

        if (op_types === undefined) {
            return feed.data;
        } else {
            return feed.data.filter(entry => op_types.includes(entry.op_type!))
        }
    });

    const reposActivities = await Promise.all(reposActivitiesPromises);

    return reposActivities.flat()
        .sort((a, b) => Temporal.Instant.compare(Temporal.Instant.from(a.created!), Temporal.Instant.from(b.created!)))
        .reverse()
}


export default defineEventHandler(() => {
    return getCombinedRepositoryFeed();
})
