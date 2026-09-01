"use client";

import { useEffect, useMemo, useRef } from "react";

type WheelItem = { label: string; value: number | string };
const ITEM_HEIGHT = 42;
const pad = (value: number) => String(value).padStart(2, "0");
function formatDate(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
function parseValue(value: string) {
  const now = new Date();
  const fallback = { date: formatDate(now), hour: now.getHours(), minute: Math.round(now.getMinutes() / 5) * 5 % 60 };
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!match) return fallback;
  return { date: match[1], hour: Number(match[2]), minute: Number(match[3]) };
}
function Wheel({ label, items, selected, onSelect }: { label: string; items: WheelItem[]; selected: number | string; onSelect: (value: number | string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === selected));
  useEffect(() => { scrollRef.current?.scrollTo({ top: selectedIndex * ITEM_HEIGHT }); }, [selectedIndex]);
  return <div className="time-wheel-column"><span>{label}</span><div ref={scrollRef} className="time-wheel-scroll" onScroll={(event) => { const index = Math.min(items.length - 1, Math.max(0, Math.round(event.currentTarget.scrollTop / ITEM_HEIGHT))); const item = items[index]; if (item && item.value !== selected) onSelect(item.value); }}>{items.map((item) => <button type="button" key={String(item.value)} className={item.value === selected ? "selected" : ""} onClick={() => onSelect(item.value)}>{item.label}</button>)}</div></div>;
}
export function AppointmentTimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = parseValue(value);
  const dates = useMemo<WheelItem[]>(() => { const start = new Date(); start.setHours(0, 0, 0, 0); return Array.from({ length: 91 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return { value: formatDate(date), label: index === 0 ? "오늘" : index === 1 ? "내일" : `${date.getMonth() + 1}월 ${date.getDate()}일` }; }); }, []);
  const hours = useMemo<WheelItem[]>(() => Array.from({ length: 24 }, (_, hour) => ({ value: hour, label: pad(hour) })), []);
  const minutes = useMemo<WheelItem[]>(() => Array.from({ length: 60 }, (_, minute) => ({ value: minute, label: pad(minute) })), []);
  const update = (next: Partial<typeof selected>) => { const date = next.date ?? selected.date; const hour = Number(next.hour ?? selected.hour); const minute = Number(next.minute ?? selected.minute); onChange(`${date}T${pad(hour)}:${pad(minute)}`); };
  return <fieldset className="appointment-time-picker"><legend>약속 시간</legend><p>목록을 위아래로 스크롤하거나 원하는 시간을 눌러 선택하세요.</p><div className="time-wheel" aria-label="약속 시간 스크롤 선택기"><Wheel label="날짜" items={dates} selected={selected.date} onSelect={(date) => update({ date: String(date) })} /><Wheel label="시" items={hours} selected={selected.hour} onSelect={(hour) => update({ hour: Number(hour) })} /><Wheel label="분" items={minutes} selected={selected.minute} onSelect={(minute) => update({ minute: Number(minute) })} /></div><input className="time-manual-input" aria-label="약속 시간 직접 입력" type="datetime-local" value={value} onChange={(event) => onChange(event.target.value)} required /></fieldset>;
}
