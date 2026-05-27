import { userListRepos } from "~~/lib/generated"
import { Temporal } from "@js-temporal/polyfill";

export const getRepos = async () => {
    const repos = await userListRepos({ path: { username: 'pixlmint' }, query: { limit: 500 } });

    if (repos.error) {
        throw repos.error;
    }

    return repos.data.map(repo => {
        return {
            name: repo.name,
            id: repo.id,
            updatedAt: Temporal.Instant.from(repo.updated_at!),
        }
    })
        .sort((a, b) => Temporal.Instant.compare(a.updatedAt, b.updatedAt))
        .reverse()
}

export default defineEventHandler(() => {
    return getRepos();
})
