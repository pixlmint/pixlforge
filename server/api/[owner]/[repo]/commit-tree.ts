import { buildCommitGraph } from '~~/server/lib/commit-tree'

export default defineEventHandler(
    buildCommitGraph,
    // },
    // {
    //     maxAge: 60 * 60 * 5,
    //     getKey: (event: H3Event) =>
    //         `commits_${event.context.params!.owner}_${event.context.params!.repo}_v3`,
)
