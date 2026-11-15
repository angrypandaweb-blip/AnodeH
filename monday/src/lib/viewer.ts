import "server-only";
import { headers } from "next/headers";
import { getIdentity } from "../../cursor/identity.js";

export type Viewer = {
  sub: string;
  name: string;
  email: string;
  stage: "production" | "preview";
};

export async function viewer(): Promise<Viewer | "key" | null> {
  const identity = await getIdentity(await headers());
  if (!identity.verified) return null;
  if (identity.kind === "key") return "key";
  if (identity.kind !== "person") return null;
  return {
    sub: identity.sub,
    name: identity.name,
    email: identity.email,
    stage: identity.stage === "preview" ? "preview" : "production",
  };
}
