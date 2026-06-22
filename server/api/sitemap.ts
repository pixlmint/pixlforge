import type { H3Event } from 'h3'
import { userListRepos } from '~~/lib/forgejo'

const listPortfolioEntries = async (event: H3Event) => {
    const data = await queryCollection(event, 'portfolio').all()

    return data.filter((entry) => entry.repository === null).map((entry) => entry.path)
}

const listRepoEntries = async () => {
    const data = await userListRepos({ path: { username: useRuntimeConfig().public.primaryUser } })

    if (data.data === undefined) return []

    return data.data.map((repo) => `/repos/${repo.name!}`)
}

export default defineEventHandler(async (event) => {
    return [...(await listPortfolioEntries(event)), ...(await listRepoEntries())]
})
