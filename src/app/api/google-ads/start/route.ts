import { randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { googleAdsSetupError, googleAuthUrl, requestOrigin } from "@/lib/google-ads";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) redirect("/login?next=/settings");
  const setupError = googleAdsSetupError();
  if (setupError) redirect(`/settings?error=${encodeURIComponent(setupError)}`);
  const origin = requestOrigin(await headers());
  if (!origin) redirect("/settings?error=Could%20not%20determine%20the%20site%20address%20for%20Google%20sign-in.");
  const state = `${user.id}.${randomBytes(16).toString("hex")}`;
  const jar = await cookies();
  jar.set("anodeh_google_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
  redirect(googleAuthUrl(origin, state));
}
