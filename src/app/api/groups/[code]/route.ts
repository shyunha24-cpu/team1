import { del, get, put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const base = (code: string) => `momentum/groups/${code.toUpperCase()}`;
async function read<T>(pathname: string, fallback: T): Promise<T> {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return fallback;
  return JSON.parse(await new Response(result.stream).text()) as T;
}
export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
  const { code } = await params; const root = base(code);
  const group = await read<Record<string, unknown> | null>(`${root}/group.json`, null);
  if (!group) return NextResponse.json({ error: "그룹을 찾을 수 없어요." }, { status: 404 });
  const [messages, routine] = await Promise.all([read(`${root}/messages.json`, []), read(`${root}/routine.json`, {})]);
  return NextResponse.json({ group, messages, routine });
  } catch (error) {
    console.error("Failed to read Momentum group", error);
    return NextResponse.json({ error: "저장된 그룹을 읽지 못했어요. Functions 로그를 확인해 주세요." }, { status: 500 });
  }
}
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
  const { code } = await params; const root = base(code); const body = await request.json();
  const group = await read<Record<string, unknown> | null>(`${root}/group.json`, null);
  if (!group) return NextResponse.json({ error: "그룹을 찾을 수 없어요." }, { status: 404 });
  if (body.type === "join") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "로그인 계정을 확인해 주세요." }, { status: 400 });
    const members = Array.isArray(group.members) ? group.members as string[] : [];
    if (group.ownerEmail !== email && !members.includes(email)) members.push(email);
    group.members = members;
    await put(`${root}/group.json`, JSON.stringify(group), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 0 });
  } else if (body.type === "message") {
    const text = String(body.text ?? "").trim(); const name = String(body.name ?? "익명").trim().slice(0, 20) || "익명";
    if (!text) return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
    const messages = await read<Array<Record<string, unknown>>>(`${root}/messages.json`, []);
    messages.push({ id: crypto.randomUUID(), text: text.slice(0, 500), name, createdAt: new Date().toISOString() });
    await put(`${root}/messages.json`, JSON.stringify(messages), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 0 });
  } else if (body.type === "routine") {
    const name = String(body.name ?? "익명").trim().slice(0, 20) || "익명"; const routine = await read<Record<string, boolean>>(`${root}/routine.json`, {});
    routine[name] = Boolean(body.done);
    await put(`${root}/routine.json`, JSON.stringify(routine), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 0 });
  } else if (body.type === "request-delete") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (group.ownerEmail !== email) return NextResponse.json({ error: "그룹 주최자만 삭제를 요청할 수 있어요." }, { status: 403 });
    group.deletionRequested = true; group.deletionApprovals = [];
    await put(`${root}/group.json`, JSON.stringify(group), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 0 });
  } else if (body.type === "approve-delete") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const members = Array.isArray(group.members) ? group.members as string[] : [];
    if (!members.includes(email)) return NextResponse.json({ error: "참여자만 삭제를 승인할 수 있어요." }, { status: 403 });
    if (!group.deletionRequested) return NextResponse.json({ error: "삭제 요청이 아직 없어요." }, { status: 400 });
    const approvals = Array.isArray(group.deletionApprovals) ? group.deletionApprovals as string[] : [];
    if (!approvals.includes(email)) approvals.push(email); group.deletionApprovals = approvals;
    await put(`${root}/group.json`, JSON.stringify(group), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 0 });
  } else if (body.type === "delete") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (group.ownerEmail !== email) return NextResponse.json({ error: "그룹 주최자만 삭제할 수 있어요." }, { status: 403 });
    const members = Array.isArray(group.members) ? group.members as string[] : [];
    const approvals = Array.isArray(group.deletionApprovals) ? group.deletionApprovals as string[] : [];
    if (!group.deletionRequested || !members.every(member => approvals.includes(member))) return NextResponse.json({ error: "모든 참여자의 승인이 필요해요." }, { status: 409 });
    await del([`${root}/group.json`, `${root}/messages.json`, `${root}/routine.json`]);
    return NextResponse.json({ deleted: true });
  } else return NextResponse.json({ error: "알 수 없는 요청이에요." }, { status: 400 });
  return GET(request, { params: Promise.resolve({ code }) });
  } catch (error) {
    console.error("Failed to update Momentum group", error);
    return NextResponse.json({ error: "저장소에 변경 사항을 저장하지 못했어요. Functions 로그를 확인해 주세요." }, { status: 500 });
  }
}
