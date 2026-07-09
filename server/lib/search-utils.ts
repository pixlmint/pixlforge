import { ProjectFilter } from '../types'
import { Temporal } from '@js-temporal/polyfill'
import type { ProjectSearchResult } from '~~/shared/types'

export const isProjectIncluded = (project: ProjectSearchResult, filter: ProjectFilter): boolean => {
    if (filter.field === 'archived') {
        return project.archived === (filter.value === 1)
    }

    if (filter.field === 'latestUpdate' || filter.field === 'lastUsed') {
        const sourceTime = Temporal.Instant.from(filter.value)
        const cmp = Temporal.Instant.compare(
            sourceTime,
            filter.field === 'latestUpdate' ? project.latestUpdate! : project.lastUsed!,
        )

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
        switch (filter.operator!) {
            case 'in':
                if (project.tags === undefined) return false
                return project.tags.includes(filter.value! as string)
            case 'nin':
                if (project.tags === undefined) return true
                return !project.tags.includes(filter.value! as string)
            case 'eq':
                return (
                    (filter.value! as string[]).sort().toString() ===
                    (project.tags ?? []).toString()
                )
            case 'any':
                return (
                    (filter.value! as string[]).filter((f) => (project.tags ?? []).includes(f))
                        .length > 0
                )
            case 'all':
                const filterValues = filter.value! as string[]
                return (
                    filterValues.filter((f) => (project.tags ?? []).includes(f)).length ===
                    filterValues.length
                )
        }
    }

    if (filter.and !== undefined) {
        for (const andFilter of filter.and) {
            const res = isProjectIncluded(project, andFilter)
            if (!res) {
                return false
            }
        }

        return true
    }

    if (filter.or !== undefined) {
        for (const orFilter of filter.or) {
            const res = isProjectIncluded(project, orFilter)
            if (res) {
                return true
            }
        }
    }

    return false
}
