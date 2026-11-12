import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { exchangeGoogleCode, pullGoogleAds, requestOrigin, saveGoogleConnection } from "@/lib/google-ads";

export const dynamic = "force-dynamic";

function fail(message: string): never {
  redirect(`/settings?error=${encodeURIComponent(message)}`);
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) redirect("/login?next=/settings");
  const url = new URL(request.url);
  const googleError = url.searchParams.get("error");
  if (googleError) fail(googleError === "access_denied" ? "Google sign-in was canceled." : "Google did not finish sign-in.");

  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const jar = await cookies();
  const saved = jar.get("anodeh_google_state")?.value || "";
  jar.delete("anodeh_google_state");
  if (!code || !state || state !== saved || !state.startsWith(`${user.id}.`)) {
    fail("Google sign-in could not be confirmed. Connect again.");
  }

  const origin = requestOrigin(await headers()) || url.origin;
  const tokens = await exchangeGoogleCode(origin, code);
  if (!tokens.ok) fail(tokens.error);
  if (!tokens.refreshToken) {
    fail("Google did not return a refresh token. Remove AnodeH at myaccount.google.com/permissions, then connect again.");
  }
  await saveGoogleConnection(user.id, tokens.refreshToken);
  const pulled = await pullGoogleAds(user.id);
  if (!pulled.ok) fail(pulled.error);
  redirect("/dashboard?notice=google");
}
