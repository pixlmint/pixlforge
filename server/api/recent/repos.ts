import { searchProjects } from '../project/search'
import type { H3Event } from 'h3'

export const getRepos = async (event: H3Event) => {
    return await searchProjects(event, { field: 'archived', value: 0 }, 'lastUsed', 'desc')
}

export default defineEventHandler((event) => {
    return getRepos(event)
})
