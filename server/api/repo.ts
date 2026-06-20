import { z } from 'zod'
import {
    repoGet,
    repoGetContents,
    repoGetContentsList,
    renderMarkdownRaw,
    issueListIssues,
} from '~~/lib/forgejo'
import { JSDOM } from 'jsdom'
import hljs from 'highlight.js'
import type { ContentsResponse } from '~~/lib/forgejo'
import { buildCommitGraph } from '../lib/commit-tree'
import type { H3Event } from 'h3'

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
    owner: z.string().default(useRuntimeConfig().public.primaryUser),
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

    if (repoContents.error) throw repoContents.error

    const readmeFile = repoContents.data.filter((file) => file.name!.toLowerCase() === 'readme.md')

    if (readmeFile.length === 0) {
        return
    }

    const readme = readmeFile[0]

    if (readme !== undefined) {
        const readmeContent = await repoGetContents({
            path: { filepath: readme.path!, ...repoRequestData.path },
        })

        const rawReadme = await getDecodedFileContent(readmeContent.data!)
        const imageRegex = /!\[.*?\]\(((?!https?:\/\/)[^)]+)\)/g

        const rawReadmeCleaned = rawReadme!
            .split('\n')
            .filter((line) => !line.startsWith('# '))
            .map((line) => {
                return line.replace('#', '##')
            })
            .join('\n')
            .replace(imageRegex, (match, p1) => {
                const imageUrl = `/api/${repoRequestData.path.owner}/${repoRequestData.path.repo}/file?path=${p1}`

                return match.replace(p1, imageUrl)
            })

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

const getPortfolioEntry = async (event: H3Event, project: string) => {
    return await queryCollection(event, 'portfolio')
        .path('/portfolio/' + project)
        .first()
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
    const portfolioEntry = await getPortfolioEntry(event, request.repo)

    return {
        meta: repoMeta.data!,
        readme: repoReadme,
        portfolio: portfolioEntry,
        issues: latestRepoIssues.data!,
        commits: commits,
    }

    // }, {
    //     maxAge: 60 * 10,
})
