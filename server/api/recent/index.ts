import type { H3Event } from 'h3'
import { getIssues } from './issues'
import { getActions } from './actions'
import { getCommits } from './commits'
import { getActivity } from './activity'
import { getRepos } from './repos'

// export default defineCachedEventHandler(
export default defineEventHandler(
    async (event) => {
        return {
            issues: await getIssues(),
            repos: await getRepos(event),
            actions: await getActions(),
            commits: await getCommits(),
            activity: await getActivity(),
        }
    },
    // },
    // {
    //     maxAge: 1,
    //     getKey: (event: H3Event) => event.path + 'v6',
    // },
)
