import { getWakatimeProjects } from '~~/lib/wakapi'
import type { V1Project } from '~~/lib/wakapi'
import { Temporal } from '@js-temporal/polyfill'

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

class WakapiWrapper {
    private projects: Record<string, V1Project> = {}

    async init() {
        this.projects = await loadProjects()
    }

    has(name: string) {
        return name in this.projects
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
