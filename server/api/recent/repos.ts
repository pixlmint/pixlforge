import { searchProjects } from '../project/search'
import type { H3Event } from 'h3'

export const getRepos = async (event: H3Event) => {
    return await searchProjects(event, {
        filter: {
            and: [
                { field: 'archived', value: 0 },
                { field: 'tags', operator: 'nin', value: 'fork' },
            ],
        },
        order: { field: 'lastUsedFrecency', direction: 'desc' },
    })
}

export default defineEventHandler((event) => {
    return getRepos(event)
})
