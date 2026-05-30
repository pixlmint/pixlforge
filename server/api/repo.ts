import { z } from "zod";
import { repoGet } from "~~/lib/generated";

const repoRequestSchema = z.object({
    repo: z.string(),
    owner: z.string().default('pixlmint'),
});

export default cachedEventHandler(async (event) => {
    const request = await getValidatedQuery(event, body => repoRequestSchema.parse(body));

    return repoGet({ path: { repo: request.repo, owner: request.owner } });
}, {
    maxAge: 60 * 10,
});
