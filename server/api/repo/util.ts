import type { H3Event } from 'h3'
import { z } from 'zod'
import { repoGetAllCommits } from '~~/lib/forgejo'

const repoRequestSchema = z.object({
    repo: z.string(),
    owner: z.string().default(useRuntimeConfig().public.primaryUser),
})

type HandlerFunction = (
    event: H3Event,
    repoRequestData: { path: { repo: string; owner: string } },
    latestHash: string | undefined,
) => any

export type RepoRequestData = {
    path: {
        repo: string
        owner: string
    }
}

const getRepoHash = defineCachedFunction(
    async (data: RepoRequestData) => {
        const commits = await repoGetAllCommits({
            path: data.path,
            query: {
                stat: false,
                verification: false,
                files: false,
                limit: 1,
            },
        })

        if (commits.error) throw commits.error

        if (commits.data.length !== 1) throw new Error('No commits found')

        return commits.data[0]!.sha!
    },
    { maxAge: 60, getKey: (data) => `repo_hash_${data.path.owner}_${data.path.repo}` },
)

export const defineRepoContentHandler = <T extends HandlerFunction>(handler: T) => {
    return defineEventHandler(async (event) => {
        const request = await getValidatedQuery(event, (body) => repoRequestSchema.parse(body))

        const repoRequestData = {
            path: { repo: request.repo, owner: request.owner },
        }

        return handler(event, repoRequestData, await getRepoHash(repoRequestData))
    })
}
