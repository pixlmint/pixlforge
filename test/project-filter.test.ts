import type { Repository } from '../lib/forgejo/index'
import { isRepoIncluded } from '../server/lib/search-utils'
import { Temporal } from '@js-temporal/polyfill'

test('archive filter behavior', () => {
    const testRepo: Repository = {
        archived: true,
    }

    expect(isRepoIncluded(testRepo, { field: 'archived', value: 0 })).toBeFalsy()
    expect(isRepoIncluded(testRepo, { and: [{ field: 'archived', value: 0 }] })).toBeFalsy()

    expect(isRepoIncluded(testRepo, { field: 'archived', value: 1 })).toBeTruthy()
    expect(isRepoIncluded(testRepo, { and: [{ field: 'archived', value: 1 }] })).toBeTruthy()
})

test('latestUpdate filter behavior', () => {
    const testTimestamp = 17835089100000 // Wed, 08 Jul 2026 11:08:30 GMT
    const testRepo: Repository = {
        updated_at: Temporal.Instant.fromEpochMilliseconds(testTimestamp).toString(),
    }

    const ts = (change: number): string =>
        Temporal.Instant.fromEpochMilliseconds(testTimestamp + change).toString()

    expect(
        isRepoIncluded(testRepo, { field: 'latestUpdate', operator: 'eq', value: ts(0) }),
    ).toBeTruthy()
    expect(
        isRepoIncluded(testRepo, { field: 'latestUpdate', operator: 'lt', value: ts(0) }),
    ).toBeFalsy()
    expect(
        isRepoIncluded(testRepo, { field: 'latestUpdate', operator: 'le', value: ts(0) }),
    ).toBeTruthy()
    expect(
        isRepoIncluded(testRepo, { field: 'latestUpdate', operator: 'gt', value: ts(100) }),
    ).toBeTruthy()
    expect(
        isRepoIncluded(testRepo, { field: 'latestUpdate', operator: 'gt', value: ts(-100) }),
    ).toBeFalsy()
})

test('tag filtering behavior', () => {
    const testRepo: Repository = {
        topics: ['tag1', 'tag2'],
    }

    expect(isRepoIncluded(testRepo, { field: 'tags', operator: 'in', value: 'tag1' })).toBeTruthy()
    expect(isRepoIncluded(testRepo, { field: 'tags', operator: 'in', value: 'tag2' })).toBeTruthy()
    expect(isRepoIncluded(testRepo, { field: 'tags', operator: 'in', value: 'tag3' })).toBeFalsy()

    expect(isRepoIncluded(testRepo, { field: 'tags', operator: 'nin', value: 'tag3' })).toBeTruthy()
    expect(isRepoIncluded(testRepo, { field: 'tags', operator: 'nin', value: 'tag1' })).toBeFalsy()

    expect(
        isRepoIncluded(testRepo, { field: 'tags', operator: 'eq', value: ['tag1', 'tag2'] }),
    ).toBeTruthy()
    expect(
        isRepoIncluded(testRepo, { field: 'tags', operator: 'eq', value: ['tag2', 'tag1'] }),
    ).toBeTruthy()
    expect(isRepoIncluded(testRepo, { field: 'tags', operator: 'eq', value: ['tag2'] })).toBeFalsy()

    expect(
        isRepoIncluded(testRepo, { field: 'tags', operator: 'any', value: ['tag2'] }),
    ).toBeTruthy()
    expect(
        isRepoIncluded(testRepo, { field: 'tags', operator: 'all', value: ['tag2'] }),
    ).toBeTruthy()
    expect(
        isRepoIncluded(testRepo, { field: 'tags', operator: 'all', value: ['tag2', 'tag2'] }),
    ).toBeTruthy()
    expect(
        isRepoIncluded(testRepo, {
            field: 'tags',
            operator: 'all',
            value: ['tag2', 'tag2', 'tag3'],
        }),
    ).toBeFalsy()
})

test('combined filters', () => {
    const testTimestamp = 17835089100000 // Wed, 08 Jul 2026 11:08:30 GMT
    const testRepo: Repository = {
        updated_at: Temporal.Instant.fromEpochMilliseconds(testTimestamp).toString(),
        archived: false,
    }

    const ts = (change: number): string =>
        Temporal.Instant.fromEpochMilliseconds(testTimestamp + change).toString()

    expect(
        isRepoIncluded(testRepo, {
            and: [
                { field: 'latestUpdate', operator: 'eq', value: ts(0) },
                { field: 'archived', value: 0 },
            ],
        }),
    ).toBeTruthy()

    expect(
        isRepoIncluded(testRepo, {
            and: [
                { field: 'latestUpdate', operator: 'eq', value: ts(0) },
                { field: 'archived', value: 1 },
            ],
        }),
    ).toBeFalsy()

    expect(
        isRepoIncluded(testRepo, {
            or: [
                { field: 'latestUpdate', operator: 'eq', value: ts(0) },
                { field: 'archived', value: 1 },
            ],
        }),
    ).toBeTruthy()
})
