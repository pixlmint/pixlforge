import { buildCommitGraph } from '~~/server/lib/commit-tree'

export default defineEventHandler(
    async (event) => {
        return buildCommitGraph(event.context.params!.repo!, event.context.params!.owner!)
    },
    // },
    // {
    //     maxAge: 60 * 60 * 5,
    //     getKey: (event: H3Event) =>
    //         `commits_${event.context.params!.owner}_${event.context.params!.repo}_v3`,
)
