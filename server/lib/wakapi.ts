import { getWakatimeProjects, getHeartbeats } from '~~/lib/wakapi'
import type { V1Project } from '~~/lib/wakapi'
import { Temporal } from '@js-temporal/polyfill'
import { kv } from '@nuxthub/kv'

const loadProjects = defineCachedFunction(
    async (): Promise<Record<string, V1Project>> => {
        const projects = await getWakatimeProjects({ path: { user: 'current' } })

        const ret: Record<string, V1Project> = {}
        for (const project of projects.data!.data!) {
            ret[project.name!] = project
        }

        return ret
    },
    { maxAge: 60, getKey: () => 'wakatime_projects_map' },
)

type ProjectsHeartbeats = Record<string, Record<number, number>>

const loadHeartbeatsOnDay = async (day: Temporal.PlainDate) => {
    const projects: Record<string, number> = {}

    const dailyHeartbeats = await getHeartbeats({
        path: { user: 'current' },
        query: { date: day.toString() },
    })

    dailyHeartbeats.data!.data!.forEach((beat) => {
        if (!(beat.project! in projects)) {
            projects[beat.project!] = 0
        }
        projects[beat.project!]! += 1
    })

    return projects
}

class WakapiWrapper {
    private projects: Record<string, V1Project> = {}

    async init() {
        this.projects = await loadProjects()
    }

    has(name: string) {
        return name in this.projects
    }

    async loadHeartbeats(until: Temporal.PlainDate) {
        let time = Temporal.Now.plainDateISO()
        const projects: ProjectsHeartbeats = {}

        while (Temporal.PlainDate.compare(time, until) >= 0) {
            const ts = Temporal.Instant.from(
                time.toZonedDateTime('UTC').toString(),
            ).epochMilliseconds
            const cacheKey = `heartbeat_${time.toString()}`
            let dailyProjectHeartbeats: Record<string, number>
            if (await kv.hasItem(cacheKey)) {
                dailyProjectHeartbeats = (await kv.getItem(cacheKey)) as Record<string, number>
            } else {
                dailyProjectHeartbeats = await loadHeartbeatsOnDay(time)
                if (Temporal.PlainDate.compare(time, Temporal.Now.plainDateISO()) !== 0) {
                    kv.setItem(cacheKey, dailyProjectHeartbeats)
                }
            }
            for (const [project, beats] of Object.entries(dailyProjectHeartbeats)) {
                if (!(project in projects)) {
                    projects[project] = {}
                }
                projects[project]![ts] = beats
            }
            time = time.subtract(new Temporal.Duration(0, 0, 0, 1))
        }

        const ranking: Record<string, number> = {}
        for (const [project, beats] of Object.entries(projects)) {
            let projectRank = -1
            for (const [ts, dailyBeats] of Object.entries(beats)) {
                projectRank += (Number.parseInt(ts) / 10_000) * dailyBeats
            }
            ranking[project] = projectRank
        }

        return ranking
    }

    getLastUsed(name: string): Temporal.Instant | undefined {
        if (!this.has(name)) return undefined

        return Temporal.Instant.from(this.projects[name]!.last_heartbeat_at!)
    }
}

export const createWakapiWrapper = async () => {
    const wrapper = new WakapiWrapper()
    await wrapper.init()
    return wrapper
}
