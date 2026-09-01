import { get, list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readGroup(pathname: string) {
  const result = await get(pathname, { access: "private" });
  if (!result?.stream || result.statusCode !== 200) return null;
  return JSON.parse(await new Response(result.stream).text()) as { code: string; title: string; place: string; when: string; ownerEmail?: string; members?: string[] };
}

export async function GET(request: Request) {
  try {
    const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
    if (!email) return NextResponse.json({ groups: [] });
    const result = await list({ prefix: "momentum/groups/", limit: 100 });
    const files = result.blobs.filter(blob => blob.pathname.endsWith("/group.json"));
    const groups = (await Promise.all(files.map(blob => readGroup(blob.pathname))))
      .filter(group => group && (group.ownerEmail === email || group.members?.includes(email)))
      .sort((a, b) => String(b?.when).localeCompare(String(a?.when)));
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Failed to list Momentum groups", error);
    return NextResponse.json({ error: "약속 목록을 불러오지 못했어요." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const place = String(body.place ?? "").trim();
  const when = String(body.when ?? "").trim();
  const latitude = Number(body.latitude); const longitude = Number(body.longitude);
  const ownerEmail = String(body.ownerEmail ?? "").trim().toLowerCase();
  if (!title || !place || !when || !ownerEmail) return NextResponse.json({ error: "약속 정보와 로그인 계정을 확인해 주세요." }, { status: 400 });
  const code = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  const group = { code, title, place, when, latitude: Number.isFinite(latitude) ? latitude : null, longitude: Number.isFinite(longitude) ? longitude : null, ownerEmail, members: [], createdAt: new Date().toISOString() };
  await Promise.all([
    put(`momentum/groups/${code}/group.json`, JSON.stringify(group), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 0 }),
    put(`momentum/groups/${code}/messages.json`, "[]", { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 0 }),
    put(`momentum/groups/${code}/routine.json`, "{}", { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 0 }),
  ]);
  return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Failed to create Momentum group", error);
    return NextResponse.json({ error: "저장소에 약속을 만들지 못했어요. Vercel 환경 변수와 Functions 로그를 확인해 주세요." }, { status: 500 });
  }
}
