import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { promisify } from "util";
import { execute, getDb, queryOne } from "./db";

const scrypt = promisify(scryptCb);
const COOKIE = "anodeh_session";
const MONTH = 60 * 60 * 24 * 30;

export type Account = { id: string; email: string; name: string };

export function safePlan(value: string | undefined): "month" | "year" | "" {
  return value === "month" || value === "year" ? value : "";
}

export function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/dashboard";
  try {
    const url = new URL(value, "http://local");
    if (url.pathname === "/login" || url.pathname === "/register") return "/dashboard";
    return url.pathname + url.search;
  } catch {
    return "/dashboard";
  }
}

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export function authReturn(value: string, fallback: string) {
  if (!AUTH_PATHS.some((path) => value.startsWith(path))) return fallback;
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const url = new URL(value, "http://local");
    if (!AUTH_PATHS.includes(url.pathname)) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 32)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const hash = (await scrypt(password, salt, 32)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  if (hash.length !== expected.length) return false;
  return timingSafeEqual(hash, expected);
}

export async function getUser(): Promise<Account | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  const row = await queryOne<Account>(
    await getDb(),
    `SELECT u.id, u.email, u.name
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?`,
    [id, Math.floor(Date.now() / 1000)],
  );
  return row ?? null;
}

export async function setSession(userId: string) {
  const id = randomBytes(24).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  await execute(await getDb(), "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)", [
    id,
    userId,
    now,
    now + MONTH,
  ]);
  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MONTH,
  });
}

export async function clearSession() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) await execute(await getDb(), "DELETE FROM sessions WHERE id = ?", [id]);
  jar.delete(COOKIE);
}
