import { get, put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type User = { id: string; name: string; email: string; password: string; createdAt: string };
const path = "momentum/users.json";
async function users(): Promise<User[]> { const result = await get(path, { access: "private" }); if (!result?.stream || result.statusCode !== 200) return []; return JSON.parse(await new Response(result.stream).text()) as User[]; }
export async function POST(request: Request) {
  try {
    const { action, name, email, password } = await request.json(); const safeEmail = String(email ?? "").trim().toLowerCase(); const safePassword = String(password ?? ""); const safeName = String(name ?? "").trim().slice(0, 20);
    if (!safeEmail || !safePassword) return NextResponse.json({ error: "이메일과 비밀번호를 입력해 주세요." }, { status: 400 });
    const list = await users();
    if (action === "signup") {
      if (!safeName) return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
      if (list.some(user => user.email === safeEmail)) return NextResponse.json({ error: "이미 가입된 이메일이에요." }, { status: 409 });
      const user: User = { id: crypto.randomUUID(), name: safeName, email: safeEmail, password: safePassword, createdAt: new Date().toISOString() };
      list.push(user); await put(path, JSON.stringify(list), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 0 });
      return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
    }
    const user = list.find(item => item.email === safeEmail && item.password === safePassword);
    if (!user) return NextResponse.json({ error: "이메일 또는 비밀번호가 맞지 않아요." }, { status: 401 });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) { console.error("Demo auth failed", error); return NextResponse.json({ error: "로그인 처리에 실패했어요." }, { status: 500 }); }
}
