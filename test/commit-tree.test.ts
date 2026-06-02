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

test('basic determineSourceBranch', () => {
    const commitMap = t.buildCommitMap(dummyCommits())

    t.linkChildren(commitMap)

    const commitUnderTest = commitMap.get('aaa0015')!
    t.determineSourceBranch(commitUnderTest, commitMap)

    expect(commitUnderTest.sourceBranch).toBe('main')
})

test('advanced determineSourceBranch', () => {
    const commitMap = t.buildCommitMap(dummyCommits().reverse())

    t.linkChildren(commitMap)

    const preDetermine = ['aaa0015', 'aaa0014', 'aaa0013']

    preDetermine.forEach((sha) => {
        const c = commitMap.get(sha)!
        t.determineSourceBranch(c, commitMap)
        expect(c.sourceBranch).toBe('main')
    })

    const commitUnderTest = commitMap.get('aaa0012')!
    t.determineSourceBranch(commitUnderTest, commitMap)

    expect(commitUnderTest.sourceBranch).toBe('feature/dashboard')
})
