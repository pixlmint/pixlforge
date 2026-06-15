import { z } from 'zod'
import { repoGetContents } from '~~/lib/generated'
import type { RepoGetContentsData, Options } from '~~/lib/generated'

const fileRequestSchema = z.object({
    path: z.string(),
})

type RepoGetMetaResponse = ReturnType<typeof repoGetContents>

const repoGetMeta = defineCachedFunction(
    async (opts: Options<RepoGetContentsData>): Promise<RepoGetMetaResponse> => {
        const response = await repoGetContents(opts)

        response.data!.content = undefined
        response.data!.encoding = undefined

        return response
    },
    {
        maxAge: 60 * 60,
    },
)

const fetchFile = defineCachedFunction(
    async (
        downloadUrl: string,
        fileSha: string,
    ): Promise<{ contentType: string; content: Buffer | { type: 'Buffer'; data: number[] } }> => {
        const content = await $fetch.raw(downloadUrl, { responseType: 'arrayBuffer' })

        return {
            contentType: content.headers.get('Content-Type') ?? 'text/raw',
            content: Buffer.from(content._data! as any),
        }
    },
    {
        maxAge: 60 * 60,
        getKey: (downloadUrl, fileSha) => `${downloadUrl}?sha=${fileSha}`,
    },
)

export default defineEventHandler(async (event) => {
    const request = await getValidatedQuery(event, (body) => fileRequestSchema.parse(body))

    const meta = await repoGetMeta({
        path: {
            owner: event.context.params!.owner!,
            repo: event.context.params!.repo!,
            filepath: request.path,
        },
    })

    const downloadUrl = meta.data!.download_url!

    const { contentType, content } = await fetchFile(downloadUrl, meta.data!.sha!)

    const buffer = 'data' in content ? Buffer.from(content.data) : content

    return send(event, buffer, contentType)
})
