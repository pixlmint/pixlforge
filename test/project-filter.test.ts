import type { ProjectSearchResult } from '../shared/types'
import { isProjectIncluded } from '../server/lib/search-utils'
import { Temporal } from '@js-temporal/polyfill'

test('archive filter behavior', () => {
    const testRepo: ProjectSearchResult = {
        title: 'test',
        archived: true,
    }

    expect(isProjectIncluded(testRepo, { field: 'archived', value: 0 })).toBeFalsy()
    expect(isProjectIncluded(testRepo, { and: [{ field: 'archived', value: 0 }] })).toBeFalsy()

    expect(isProjectIncluded(testRepo, { field: 'archived', value: 1 })).toBeTruthy()
    expect(isProjectIncluded(testRepo, { and: [{ field: 'archived', value: 1 }] })).toBeTruthy()
})

test('lastUsed filter behavior', () => {
    const testTimestamp = 17835089100000 // Wed, 08 Jul 2026 11:08:30 GMT
    const testRepo: ProjectSearchResult = {
        title: 'test',
        lastUsed: Temporal.Instant.fromEpochMilliseconds(testTimestamp),
    }

    const ts = (change: number): string =>
        Temporal.Instant.fromEpochMilliseconds(testTimestamp + change).toString()

    expect(
        isProjectIncluded(testRepo, { field: 'lastUsed', operator: 'eq', value: ts(0) }),
    ).toBeTruthy()
    expect(
        isProjectIncluded(testRepo, { field: 'lastUsed', operator: 'lt', value: ts(0) }),
    ).toBeFalsy()
    expect(
        isProjectIncluded(testRepo, { field: 'lastUsed', operator: 'le', value: ts(0) }),
    ).toBeTruthy()
    expect(
        isProjectIncluded(testRepo, { field: 'lastUsed', operator: 'gt', value: ts(100) }),
    ).toBeTruthy()
    expect(
        isProjectIncluded(testRepo, { field: 'lastUsed', operator: 'gt', value: ts(-100) }),
    ).toBeFalsy()
})

test('tag filtering behavior', () => {
    const testRepo: ProjectSearchResult = {
        title: 'test',
        tags: ['tag1', 'tag2'],
    }

    expect(
        isProjectIncluded(testRepo, { field: 'tags', operator: 'in', value: 'tag1' }),
    ).toBeTruthy()
    expect(
        isProjectIncluded(testRepo, { field: 'tags', operator: 'in', value: 'tag2' }),
    ).toBeTruthy()
    expect(
        isProjectIncluded(testRepo, { field: 'tags', operator: 'in', value: 'tag3' }),
    ).toBeFalsy()

    expect(
        isProjectIncluded(testRepo, { field: 'tags', operator: 'nin', value: 'tag3' }),
    ).toBeTruthy()
    expect(
        isProjectIncluded(testRepo, { field: 'tags', operator: 'nin', value: 'tag1' }),
    ).toBeFalsy()

    expect(
        isProjectIncluded(testRepo, { field: 'tags', operator: 'eq', value: ['tag1', 'tag2'] }),
    ).toBeTruthy()
    expect(
        isProjectIncluded(testRepo, { field: 'tags', operator: 'eq', value: ['tag2', 'tag1'] }),
    ).toBeTruthy()
    expect(
        isProjectIncluded(testRepo, { field: 'tags', operator: 'eq', value: ['tag2'] }),
    ).toBeFalsy()

    expect(
        isProjectIncluded(testRepo, { field: 'tags', operator: 'any', value: ['tag2'] }),
    ).toBeTruthy()
    expect(
        isProjectIncluded(testRepo, { field: 'tags', operator: 'all', value: ['tag2'] }),
    ).toBeTruthy()
    expect(
        isProjectIncluded(testRepo, { field: 'tags', operator: 'all', value: ['tag2', 'tag2'] }),
    ).toBeTruthy()
    expect(
        isProjectIncluded(testRepo, {
            field: 'tags',
            operator: 'all',
            value: ['tag2', 'tag2', 'tag3'],
        }),
    ).toBeFalsy()
})

test('combined filters', () => {
    const testTimestamp = 17835089100000 // Wed, 08 Jul 2026 11:08:30 GMT
    const testRepo: ProjectSearchResult = {
        lastUsed: Temporal.Instant.fromEpochMilliseconds(testTimestamp),
        title: 'test',
        archived: false,
        tags: ['tag1', 'tag2'],
    }

    const ts = (change: number): string =>
        Temporal.Instant.fromEpochMilliseconds(testTimestamp + change).toString()

    expect(
        isProjectIncluded(testRepo, {
            and: [
                { field: 'lastUsed', operator: 'eq', value: ts(0) },
                { field: 'archived', value: 0 },
            ],
        }),
    ).toBeTruthy()

    expect(
        isProjectIncluded(testRepo, {
            and: [
                { field: 'lastUsed', operator: 'eq', value: ts(0) },
                { field: 'archived', value: 1 },
            ],
        }),
    ).toBeFalsy()

    expect(
        isProjectIncluded(testRepo, {
            or: [
                { field: 'lastUsed', operator: 'eq', value: ts(0) },
                { field: 'archived', value: 1 },
            ],
        }),
    ).toBeTruthy()

    expect(
        isProjectIncluded(testRepo, {
            and: [
                { field: 'archived', value: 0 },
                { field: 'tags', operator: 'nin', value: 'tag1' },
            ],
        }),
    ).toBeFalsy()

    expect(
        isProjectIncluded(testRepo, {
            and: [
                { field: 'archived', value: 0 },
                { field: 'tags', operator: 'nin', value: 'tag3' },
            ],
        }),
    ).toBeTruthy()
})
