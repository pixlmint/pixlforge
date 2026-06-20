import { userListRepos, listActionRuns } from '~~/lib/forgejo'
import { Temporal } from '@js-temporal/polyfill'

const findReposWithActions = defineCachedFunction(
    async () => {
        const repos = await userListRepos({
            path: { username: useRuntimeConfig().public.primaryUser },
            query: { limit: 500 },
        })

        if (repos.error) {
            throw repos.error
        }

        const reposWithActions = repos.data.filter((repo) => repo.has_actions)

        const reposActionsPromises = reposWithActions.map(async (repo) => {
            const repoActions = await listActionRuns({
                path: { owner: repo.owner?.login!, repo: repo.name! },
            })

            if (repoActions.error) {
                console.error(
                    `Error ${repoActions.response!.status} (${repo.full_name}): ${repoActions.error.message}`,
                )
                return {
                    repo: repo,
                    actions: {
                        total_count: 0,
                        workflow_runs: [],
                    },
                }
            }

            return {
                repo: repo,
                actions: repoActions.data,
            }
        })

        const reposActions = await Promise.all(reposActionsPromises)

        return reposActions.filter((repoActions) => {
            return repoActions.actions.total_count! > 0
        })
    },
    {
        maxAge: 1,
        getKey: () => 'reposWithActions',
    },
)

export const getActions = async () => {
    const reposWithActions = await findReposWithActions()

    return reposWithActions.map((repo) => {
        const firstAction = repo.actions.workflow_runs![0]!
        return {
            repo: repo.repo.full_name,
            id: firstAction.id,
            title: firstAction.title,
            workflowId: firstAction.workflow_id,
            status: firstAction.status,
            triggerEvent: firstAction.trigger_event,
            updatedAt: Temporal.Instant.from(firstAction.updated!),
            htmlUrl: firstAction.html_url,
        }
    })
}

export default defineEventHandler(() => getActions())
