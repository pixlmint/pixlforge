import {
    type ContentsResponse,
    renderMarkdownRaw,
    repoGetContents,
    repoGetContentsList,
} from '~~/lib/forgejo'
import { defineRepoContentHandler } from './util'
import type { RepoRequestData } from '.'
import { JSDOM } from 'jsdom'
import hljs from 'highlight.js'
import { PortfolioCollectionItem } from '@nuxt/content'
import type { H3Event } from 'h3'
import type { RepoReadme } from '~~/shared/types'

const getDecodedFileContent = async (file: ContentsResponse): Promise<string | undefined> => {
    if (file.content === undefined || file.encoding === undefined) {
        return
    }

    if (file.encoding === 'base64') {
        return atob(file.content)
    }
}

const imageRegex = /!\[.*?\]\(((?!https?:\/\/)[^)]+)\)/g

const cleanMarkdown = (md: string, repoRequestData: RepoRequestData) =>
    md
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

const renderMarkdown = async (md: string) => {
    const rendered = await renderMarkdownRaw({
        body: md,
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

    if (rendered.error) {
        console.error(rendered.error)
        return
    }

    const dom = new JSDOM(rendered.data)
    const document = dom.window.document

    const codeBlocks = document.querySelectorAll('pre code')
    codeBlocks.forEach((block) => {
        // @ts-ignore
        hljs.highlightElement(block)
    })

    return dom.serialize()
}

const getRepoReadme = defineCachedFunction(
    async (
        repoRequestData: RepoRequestData,
        latestCommit: string | undefined,
    ): Promise<[string | undefined, string | undefined]> => {
        const repoContents = await repoGetContentsList(repoRequestData)

        if (repoContents.error) throw repoContents.error

        const readmeFile = repoContents.data.filter(
            (file) => file.name!.toLowerCase() === 'readme.md',
        )

        if (readmeFile.length > 0) {
            const readme = readmeFile[0]

            if (readme !== undefined) {
                const readmeContent = await repoGetContents({
                    path: { filepath: readme.path!, ...repoRequestData.path },
                })

                const rawReadme = await getDecodedFileContent(readmeContent.data!)
                const processedReadme = cleanMarkdown(rawReadme!, repoRequestData)
                const renderedReadme = await renderMarkdown(processedReadme)

                return [rawReadme, renderedReadme]
            }
        }

        return [undefined, undefined]
    },
    {
        maxAge: 60 * 60 * 24 * 7,
        getKey: (data, sha) => `readme_${data.path.owner}_${data.path.repo}_${sha}`,
    },
)

const getPortfolioEntry = defineCachedFunction(
    async (event: H3Event, project: string) =>
        await queryCollection(event, 'portfolio')
            .path('/portfolio/' + project)
            .first(),
    { maxAge: 60 * 60 * 24 * 30, getKey: (event, project) => `portfolio_${project}` },
)

export const getProjectContent = async (
    event: H3Event,
    repoRequestData: RepoRequestData,
    latestCommit: string | undefined,
): Promise<RepoReadme> => {
    const [raw, rendered] = await getRepoReadme(repoRequestData, latestCommit)

    return {
        raw: raw,
        html: rendered,
        portfolio: await getPortfolioEntry(event, repoRequestData.path.repo),
    }
}

export default defineRepoContentHandler(
    async (event, repoRequestData, latestCommit): Promise<RepoReadme> => {
        return await getProjectContent(event, repoRequestData, latestCommit)
    },
)
