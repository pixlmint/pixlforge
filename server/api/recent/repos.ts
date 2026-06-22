import { searchProjects } from '../project/search'
import type { H3Event } from 'h3'

export const getRepos = async (event: H3Event) => {
    return await searchProjects(event, {
        filter: { field: 'archived', value: 0 },
        order: { field: 'lastUsed', direction: 'desc' },
    })
}

export default defineEventHandler((event) => {
    return getRepos(event)
})
