import { Repository } from '~~/lib/forgejo'
import { ProjectFilter } from '../types'
import { Temporal } from '@js-temporal/polyfill'
import { PortfolioCollectionItem } from '@nuxt/content'

export const isRepoIncluded = (repo: Repository, filter: ProjectFilter): boolean => {
    if (filter.field === 'archived' && repo.archived === (filter.value === 1)) {
        return true
    }

    if (filter.field === 'latestUpdate') {
        const sourceTime = Temporal.Instant.from(filter.value)
        const cmp = Temporal.Instant.compare(sourceTime, repo.updated_at!)

        switch (filter.operator!) {
            case 'eq':
                return cmp === 0
            case 'ge':
                return cmp >= 0
            case 'le':
                return cmp <= 0
            case 'gt':
                return cmp > 0
            case 'lt':
                return cmp < 0
        }
    }

    if (filter.field === 'tags') {
        const tags = [repo.language, ...(repo.topics ?? [])].filter((s) => s !== undefined).sort()
        switch (filter.operator!) {
            case 'in':
                return tags.includes(filter.value! as string)
            case 'nin':
                return !tags.includes(filter.value! as string)
            case 'eq':
                return (filter.value! as string[]).sort().toString() === tags.toString()
            case 'any':
                return (filter.value! as string[]).filter((f) => tags.includes(f)).length > 0
            case 'all':
                const filterValues = filter.value! as string[]
                return filterValues.filter((f) => tags.includes(f)).length === filterValues.length
        }
    }

    if (filter.and !== undefined) {
        for (const andFilter of filter.and) {
            const res = isRepoIncluded(repo, andFilter)
            if (!res) {
                return false
            }
        }

        return true
    }

    if (filter.or !== undefined) {
        for (const orFilter of filter.or) {
            const res = isRepoIncluded(repo, orFilter)
            if (res) {
                return true
            }
        }
    }

    return false
}
