import { type AppSyncResolverEvent } from "aws-lambda";

export type ResolverEvent = AppSyncResolverEvent<Record<string, unknown>>;
