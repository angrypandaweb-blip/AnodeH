"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addAllow,
  blockManually,
  dismissAlerts,
  previewCeiling,
  removeAllow,
  removeBlock,
  savePolicy,
} from "@/lib/engine";
import { authReturn, clearSession, getUser, hashPassword, safeNext, setSession, verifyPassword } from "@/lib/auth";
import { normalizeAdsAccount } from "@/lib/format";
import { createPayPalCheckout } from "@/lib/billing";
import { execute, getDb, queryOne } from "@/lib/db";
import { resetDemo, simulateScenario } from "@/lib/seed";
import type { Sensitivity } from "@/lib/types";
import { createHash, randomBytes } from "crypto";

function refresh() {
  revalidatePath("/", "layout");
}

export async function runScenario(formData: FormData) {
  const scenario = String(formData.get("scenario") || "");
  const allowed = ["shoppers", "competitor", "datacenter", "vpn"];
  if (!allowed.includes(scenario)) redirect("/dashboard");
  const added = await simulateScenario(scenario);
  refresh();
  redirect(`/dashboard?notice=${scenario}&n=${added}`);
}

export async function runCeiling() {
  const added = await previewCeiling();
  refresh();
  redirect(`/protection?notice=pressure&n=${added}`);
}

export async function restoreSample() {
  await resetDemo();
  refresh();
  redirect("/dashboard?notice=reset&n=1");
}

export async function saveAdsAccount(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/settings");
  const adsAccount = normalizeAdsAccount(String(formData.get("adsAccount") || ""));
  if (!adsAccount) {
    redirect(withError("/settings", "Enter a 10-digit Google Ads account number, like 123-456-7890."));
  }
  await execute(await getDb(), "UPDATE users SET ads_account = ? WHERE id = ?", [adsAccount, user.id]);
  refresh();
  redirect("/settings?saved=1");
}

export async function updateSettings(formData: FormData) {
  const sensitivity = String(formData.get("sensitivity"));
  const safe: Sensitivity =
    sensitivity === "conservative" || sensitivity === "aggressive" ? sensitivity : "balanced";
  const blockDays = Number(formData.get("blockDays"));
  await savePolicy({
    sensitivity: safe,
    blockDays: Number.isFinite(blockDays) ? blockDays : 30,
    autoBlock: formData.get("autoBlock") === "on",
  });
  refresh();
  redirect("/settings?saved=1");
}

export async function createAllow(formData: FormData) {
  const result = await addAllow(String(formData.get("value") || ""), String(formData.get("note") || ""));
  refresh();
  if (!result.ok) redirect(`/settings?error=${encodeURIComponent(result.error)}`);
  redirect("/settings?saved=1");
}

export async function deleteAllow(formData: FormData) {
  await removeAllow(String(formData.get("id") || ""));
  refresh();
  redirect("/settings");
}

function activityReturn(value: string) {
  if (!value.startsWith("/activity") || value.startsWith("//")) return "/activity";
  return value;
}

export async function manualBlock(formData: FormData) {
  const back = activityReturn(String(formData.get("return") || "/activity"));
  const result = await blockManually(
    String(formData.get("ip") || ""),
    String(formData.get("campaign") || ""),
    Number(formData.get("score") || 70),
  );
  refresh();
  const destination = new URL(back, "http://local");
  if (!result.ok) destination.searchParams.set("error", result.error);
  const query = destination.searchParams.toString();
  redirect(query ? `${destination.pathname}?${query}` : destination.pathname);
}

function protectionReturn(value: string) {
  if (!value.startsWith("/protection") || value.startsWith("//")) return "/protection";
  return value;
}

export async function unblock(formData: FormData) {
  await removeBlock(String(formData.get("id") || ""));
  refresh();
  redirect(protectionReturn(String(formData.get("return") || "/protection")));
}

export async function clearAlerts() {
  await dismissAlerts();
  refresh();
  redirect("/dashboard");
}

function withError(path: string, message: string) {
  const url = new URL(path, "http://local");
  url.searchParams.set("error", message);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export async function registerAccount(formData: FormData) {
  const back = authReturn(String(formData.get("return") || ""), "/register");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const adsAccount = normalizeAdsAccount(String(formData.get("adsAccount") || ""));
  if (name.length < 1 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || !adsAccount) {
    redirect(withError(back, "Enter your name, a valid email, a password of at least 8 characters, and a 10-digit Google Ads account number."));
  }
  const db = await getDb();
  const existing = await queryOne<{ id: string }>(db, "SELECT id FROM users WHERE lower(email) = ?", [email]);
  if (existing) redirect(withError(back, "That email already has an account. Log in with it. Each person needs their own email."));
  const id = `u${randomBytes(6).toString("hex")}`;
  try {
    await execute(
      db,
      "INSERT INTO users (id, email, name, password_hash, created_at, ads_account, domain_key) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, email, name, await hashPassword(password), Math.floor(Date.now() / 1000), adsAccount, `cf_${randomBytes(8).toString("hex")}`],
    );
  } catch (error) {
    if (String(error).includes("UNIQUE")) {
      redirect(withError(back, "That email already has an account. Log in with it. Each person needs their own email."));
    }
    throw error;
  }
  await setSession(id);
  redirect("/dashboard");
}

export async function loginAccount(formData: FormData) {
  const back = authReturn(String(formData.get("return") || ""), "/login");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = safeNext(String(formData.get("next") || "/dashboard"));
  const row = await queryOne<{ id: string; password_hash: string }>(
    await getDb(),
    "SELECT id, password_hash FROM users WHERE lower(email) = ?",
    [email],
  );
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    redirect(withError(back, "Email or password is wrong."));
  }
  await setSession(row.id);
  redirect(next);
}

export async function logoutAccount() {
  await clearSession();
  redirect("/");
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(formData: FormData) {
  const back = authReturn(String(formData.get("return") || ""), "/forgot-password");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(withError(back, "Enter the email on the account."));
  }
  const db = await getDb();
  const user = await queryOne<{ id: string }>(db, "SELECT id FROM users WHERE lower(email) = ?", [email]);
  if (!user) redirect(withError(back, "No account uses that email."));
  const token = randomBytes(24).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  await execute(db, "DELETE FROM password_resets WHERE user_id = ?", [user.id]);
  await execute(db, "INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)", [
    `r${randomBytes(6).toString("hex")}`,
    user.id,
    tokenHash(token),
    now + 30 * 60,
  ]);
  redirect(`/reset-password?token=${token}`);
}

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const back = token ? `/reset-password?token=${encodeURIComponent(token)}` : "/forgot-password";
  if (password.length < 8) redirect(withError(back, "Use a password of at least 8 characters."));
  const db = await getDb();
  const row = await queryOne<{ id: string; user_id: string }>(
    db,
    "SELECT id, user_id FROM password_resets WHERE token_hash = ? AND expires_at > ?",
    [tokenHash(token), Math.floor(Date.now() / 1000)],
  );
  if (!row) redirect(withError("/forgot-password", "That reset link has expired. Request a new one."));
  await execute(db, "UPDATE users SET password_hash = ? WHERE id = ?", [await hashPassword(password), row.user_id]);
  await execute(db, "DELETE FROM password_resets WHERE user_id = ?", [row.user_id]);
  await execute(db, "DELETE FROM sessions WHERE user_id = ?", [row.user_id]);
  redirect("/login?reset=1");
}

export async function beginCheckout(formData: FormData) {
  const choice = String(formData.get("plan")) === "year" ? "year" : "month";
  const result = await createPayPalCheckout(choice);
  if ("error" in result) {
    redirect(`/billing?error=${encodeURIComponent(result.error || "PayPal could not start the payment.")}`);
  }
  redirect(result.url);
}


