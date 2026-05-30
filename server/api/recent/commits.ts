import type { Activity } from "~~/lib/generated";
import type { FeedCommitEntryContent } from "~~/server/types";
import { repoGetSingleCommit } from "~~/lib/generated";
import { getCombinedRepositoryFeed, parseActivityContent } from "../feed";

type UnpackedActivity = Activity & {
    jsonContent: FeedCommitEntryContent
}

export const getCommits = async () => {
    const reposActivities = await getCombinedRepositoryFeed(["commit_repo", "mirror_sync_push"]);

    return Promise.all(reposActivities
        .map(entry => {
            const unpackedContent = parseActivityContent(entry);

            if (unpackedContent) {
                const ret = entry as UnpackedActivity;
                ret.jsonContent = unpackedContent;

                return ret;
            } else {
                return {
                    jsonContent: null,
                    ...entry
                }
            }
        })
        .filter(entry => entry.jsonContent !== null && entry.jsonContent.HeadCommit !== null)
        .map(async entry => {
            const commitInfo = await repoGetSingleCommit({ path: { owner: "pixlmint", repo: entry.repo!.name!, sha: entry.jsonContent!.HeadCommit!.Sha1 } })

            return {
                repo: entry.repo!.name,
                committer: entry.repo!.owner!.login,
                date: entry.created!,
                branch: entry.ref_name!,
                message: entry.jsonContent!.HeadCommit!.Message,
                sha: entry.jsonContent!.HeadCommit!.Sha1,
                stats: commitInfo.data!.stats,
            }
        })
    )
}


export default defineEventHandler(() => {
    return getCommits();
});
