import type { H3Event } from 'h3'
import { getRepos } from './recent/repos'

const listRepoEntries = async (event: H3Event) => {
    const data = await getRepos(event)

    return data.map((project) => {
        if (typeof project.forgeId === 'string') {
            return `/repos/${project.forgeId}`
        } else if (typeof project.portfolioId) {
            return project.portfolioId
        }
    })
}

export default defineEventHandler(async (event) => {
    return await listRepoEntries(event)
})
