import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const place = String(body.place ?? "").trim();
  const when = String(body.when ?? "").trim();
  if (!title || !place || !when) return NextResponse.json({ error: "약속 이름, 시간, 장소를 모두 입력해 주세요." }, { status: 400 });
  const code = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  const group = { code, title, place, when, createdAt: new Date().toISOString() };
  await Promise.all([
    put(`momentum/groups/${code}/group.json`, JSON.stringify(group), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" }),
    put(`momentum/groups/${code}/messages.json`, "[]", { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" }),
    put(`momentum/groups/${code}/routine.json`, "{}", { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" }),
  ]);
  return NextResponse.json(group, { status: 201 });
}
