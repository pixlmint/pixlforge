import { z } from 'zod'
import {
    repoGet,
    repoGetContents,
    repoGetContentsList,
    renderMarkdownRaw,
    issueListIssues,
} from '~~/lib/generated'
import { JSDOM } from 'jsdom'
import hljs from 'highlight.js'
import type { ContentsResponse } from '~~/lib/generated'
import { buildCommitGraph } from '../lib/commit-tree'

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

const getLatestRepoIssues = async (repoRequestData: RepoRequestData) => {
    return await issueListIssues({
        path: repoRequestData.path,
        query: { limit: 25, state: 'all', sort: 'latest' },
    })
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

        const dom = new JSDOM(parsedReadme)
        const document = dom.window.document

        const codeBlocks = document.querySelectorAll('pre code')
        codeBlocks.forEach((block) => {
            hljs.highlightElement(block)
        })

        return {
            raw: rawReadme,
            html: dom.serialize(),
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
    const latestRepoIssues = await getLatestRepoIssues(repoRequestData)
    const commits = await buildCommitGraph(request.repo, request.owner)

    return {
        meta: repoMeta.data!,
        readme: repoReadme,
        issues: latestRepoIssues.data!,
        commits: commits,
    }

    // }, {
    //     maxAge: 60 * 10,
})
