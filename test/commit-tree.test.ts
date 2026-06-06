import { dummyCommits } from './dummy-commit-data'
import { testHelpers as t } from '../server/lib/commit-tree'
import type { HistoryCommit } from '../shared/types'

test('dummy commits exist', () => {
    expect(dummyCommits().length).toEqual(3)
})

test('buildCommitMap', () => {
    const commits = dummyCommits()

    const commitMap = t.buildCommitMap(commits)

    expect(commitMap.size).toBe(15)
})

test('linkChildren', () => {
    const commitMap = t.buildCommitMap(dummyCommits())

    t.linkChildren(commitMap)

    const childrenMap = {
        aaa0014: 'aaa0015',
        aaa0013: 'aaa0014',
        aaa0012: 'aaa0013',
    }

    for (const [parent, child] of Object.entries(childrenMap)) {
        expect(commitMap.has(parent)).toBeTruthy()
        expect(
            commitMap
                .get(parent)
                .children.map((c) => c.sha)
                .includes(child),
        ).toBeTruthy()
    }
})
