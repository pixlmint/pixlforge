import type { H3Event } from 'h3'
import { getIssues } from './issues'
import { getActions } from './actions'
import { getCommits } from './commits'
import { getActivity } from './activity'
import { searchProjects } from '../project/search'

export default defineCachedEventHandler(
    async (event) => {
        return {
            issues: await getIssues(),
            repos: await searchProjects(
                event,
                { field: 'archived', value: 0 },
                'latestUpdate',
                'desc',
            ),
            actions: await getActions(),
            commits: await getCommits(),
            activity: await getActivity(),
        }
    },
    {
        maxAge: 1,
        getKey: (event: H3Event) => event.path + 'v6',
    },
)
