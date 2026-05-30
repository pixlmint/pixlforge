import type { H3Event } from "h3";
import { getIssues } from "./issues";
import { getRepos } from "./repos";
import { getActions } from "./actions";
import { getCommits } from "./commits";
import { getActivity } from "./activity";

export default defineEventHandler(async () => {
    return {
        issues: await getIssues(),
        repos: await getRepos(),
        actions: await getActions(),
        commits: await getCommits(),
        activity: await getActivity(),
    }
// }, {
//     maxAge: 1,
//     getKey: (event: H3Event) => event.path + 'v5',
})
