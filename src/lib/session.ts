import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "ab_admin";
const MEMBER_COOKIE = "ab_member";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set in production");
    }
    return new TextEncoder().encode("dev-only-secret-change-me-dev-only-secret");
  }
  return new TextEncoder().encode(value);
}

type SessionPayload = { sub: string; kind: "admin" | "member" };

async function sign(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

async function verify(token: string | undefined, kind: SessionPayload["kind"]) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.kind !== kind || typeof payload.sub !== "string") return null;
    return Number(payload.sub);
  } catch {
    return null;
  }
}

async function setCookie(name: string, value: string) {
  (await cookies()).set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function startAdminSession(adminId: number) {
  await setCookie(ADMIN_COOKIE, await sign({ sub: String(adminId), kind: "admin" }));
}
export async function startMemberSession(memberId: number) {
  await setCookie(MEMBER_COOKIE, await sign({ sub: String(memberId), kind: "member" }));
}
export async function readAdminSession() {
  return verify((await cookies()).get(ADMIN_COOKIE)?.value, "admin");
}
export async function readMemberSession() {
  return verify((await cookies()).get(MEMBER_COOKIE)?.value, "member");
}
export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
export async function endMemberSession() {
  (await cookies()).delete(MEMBER_COOKIE);
}
