import { z } from 'zod'
import { repoGet, repoGetContents, repoGetContentsList, renderMarkdownRaw } from '~~/lib/generated'
import type { ContentsResponse } from '~~/lib/generated'

type RepoReadme = {
    raw?: string
    html?: string
}

type RepoRequestData = {
    path: {
        repo: string
        owner: string
    }
}

const repoRequestSchema = z.object({
    repo: z.string(),
    owner: z.string().default('pixlmint'),
})

const getDecodedFileContent = async (file: ContentsResponse): Promise<string | undefined> => {
    if (file.content === undefined || file.encoding === undefined) {
        return
    }

    if (file.encoding === 'base64') {
        return atob(file.content)
    }
}

const getRepoReadme = async (repoRequestData: RepoRequestData): Promise<RepoReadme | undefined> => {
    const repoContents = await repoGetContentsList(repoRequestData)

    const readmeFile = repoContents.data!.filter((file) => file.name!.toLowerCase() === 'readme.md')

    if (readmeFile.length === 0) {
        return
    }

    const readme = readmeFile[0]

    if (readme !== undefined) {
        const readmeContent = await repoGetContents({
            path: { filepath: readme.path!, ...repoRequestData.path },
        })

        const rawReadme = await getDecodedFileContent(readmeContent.data!)

        const rawReadmeCleaned = rawReadme!
            .split('\n')
            .filter((line) => !line.startsWith('# '))
            .join('\n')

        const parsedReadmeResponse = await renderMarkdownRaw({
            body: rawReadmeCleaned,
            security: [
                {
                    scheme: 'bearer',
                    type: 'apiKey',
                },
            ],
            auth: (auth) => {
                return useRuntimeConfig().forgejoRenderMarkdownToken
            },
        })

        const parsedReadme =
            parsedReadmeResponse.error === undefined ? parsedReadmeResponse.data : undefined

        return {
            raw: rawReadme,
            html: parsedReadme,
        }
    }
}

export default defineEventHandler(async (event) => {
    const request = await getValidatedQuery(event, (body) => repoRequestSchema.parse(body))

    const repoRequestData = {
        path: { repo: request.repo, owner: request.owner },
    }
    const repoMeta = await repoGet(repoRequestData)

    const repoReadme = await getRepoReadme(repoRequestData)

    return {
        meta: repoMeta.data!,
        readme: repoReadme,
    }

    // }, {
    //     maxAge: 60 * 10,
})
