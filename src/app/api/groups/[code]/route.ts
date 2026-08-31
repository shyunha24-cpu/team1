import { get, put } from "@vercel/blob";
import { NextResponse } from "next/server";

const base = (code: string) => `momentum/groups/${code.toUpperCase()}`;
async function read<T>(pathname: string, fallback: T): Promise<T> {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return fallback;
  return JSON.parse(await new Response(result.stream).text()) as T;
}
export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; const root = base(code);
  const group = await read<Record<string, unknown> | null>(`${root}/group.json`, null);
  if (!group) return NextResponse.json({ error: "그룹을 찾을 수 없어요." }, { status: 404 });
  const [messages, routine] = await Promise.all([read(`${root}/messages.json`, []), read(`${root}/routine.json`, {})]);
  return NextResponse.json({ group, messages, routine });
}
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; const root = base(code); const body = await request.json();
  const group = await read<Record<string, unknown> | null>(`${root}/group.json`, null);
  if (!group) return NextResponse.json({ error: "그룹을 찾을 수 없어요." }, { status: 404 });
  if (body.type === "message") {
    const text = String(body.text ?? "").trim(); const name = String(body.name ?? "익명").trim().slice(0, 20) || "익명";
    if (!text) return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
    const messages = await read<Array<Record<string, unknown>>>(`${root}/messages.json`, []);
    messages.push({ id: crypto.randomUUID(), text: text.slice(0, 500), name, createdAt: new Date().toISOString() });
    await put(`${root}/messages.json`, JSON.stringify(messages), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
  } else if (body.type === "routine") {
    const name = String(body.name ?? "익명").trim().slice(0, 20) || "익명"; const routine = await read<Record<string, boolean>>(`${root}/routine.json`, {});
    routine[name] = Boolean(body.done);
    await put(`${root}/routine.json`, JSON.stringify(routine), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
  } else return NextResponse.json({ error: "알 수 없는 요청이에요." }, { status: 400 });
  return GET(request, { params: Promise.resolve({ code }) });
}
