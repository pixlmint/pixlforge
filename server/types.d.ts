import { Temporal } from "@js-temporal/polyfill";
import { getActions } from "./api/recent/actions"
import { getIssues } from "./api/recent/issues";
import { getRepos } from "./api/recent/repos";
import { getCommits } from "./api/recent/commits";

type Serialize<T> =
    T extends Temporal.Instant
    ? string // If it's a Temporal, turn it into a string
    : T extends Date
    ? string
    : T extends Array<infer U>
    ? Array<Serialize<U>> // If it's an array, serialize the elements inside
    : T extends object
    ? { [K in keyof T]: Serialize<T[K]> } // If it's an object, serialize its properties
    : T; // Otherwise, leave it alone (string, number, boolean, etc.)


type AwaitedReturnTypeList<T> = Awaited<ReturnType<T>>[number]


export type RecentAction = AwaitedReturnTypeList<typeof getActions>

export type SerializedRecentAction = Serialize<RecentAction>

export type RecentIssue = AwaitedReturnTypeList<typeof getIssues>

export type SerializedRecentIssue = Serialize<RecentIssue>

export type ListedRepo = AwaitedReturnTypeList<typeof getRepos>

export type SerializedListedRepo = Serialize<ListedRepo>

export type RecentCommit = AwaitedReturnTypeList<typeof getCommits>

export type SerializedRecentCommit = Serialize<RecentCommit>
