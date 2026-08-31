"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const routine = [["01", "가방 챙기기", "지갑 · 충전기 · 약속 선물"], ["02", "출발 준비", "옷 갈아입고 현관 앞까지"], ["03", "집 밖으로", "도착 예상 18:20"]];

export default function Home() {
  const [loading, setLoading] = useState(true); const [checked, setChecked] = useState([true, false, false]); const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { const saved = window.localStorage.getItem("momentum-routine"); const session = window.localStorage.getItem("momentum-session"); if (saved) setChecked(JSON.parse(saved)); setSignedIn(Boolean(session)); const timer = window.setTimeout(() => setLoading(false), 500); return () => window.clearTimeout(timer); }, []);
  const toggleRoutine = (index: number) => { const next = checked.map((value, i) => i === index ? !value : value); setChecked(next); window.localStorage.setItem("momentum-routine", JSON.stringify(next)); };
  const startSession = () => { window.localStorage.setItem("momentum-session", "demo-user"); setSignedIn(true); };
  if (loading) return <main className="shell loading-screen" aria-label="불러오는 중"><div className="spinner" /><p>오늘의 약속을 불러오는 중이에요</p></main>;
  const progress = checked.filter(Boolean).length;
  return <main className="shell">
    <nav className="topbar"><Link href="/" className="brand"><span className="brand-mark">M</span> Momentum</Link><button className="profile-button" onClick={startSession} aria-label="로그인"><span className="avatar">{signedIn ? "민" : "?"}</span></button></nav>
    <section className="hero glass"><div className="eyebrow"><span className="live-dot" /> 오늘의 약속</div><h1>늦지 않게,<br /><em>우리 같이 움직이자.</em></h1><p>작은 준비를 하나씩 끝내면 약속 장소까지 자연스럽게 갈 수 있어요.</p><div className="appointment"><div><span>오늘 · 18:30</span><strong>서연이네 생일 모임</strong></div><div className="location">성수역 3번 출구<br />도보 8분</div></div><Link className="primary-button" href="/chat">친구들과 조율하기 <span>→</span></Link></section>
    <section className="section-heading"><div><p>출발 루틴</p><h2>지금 할 수 있는 한 가지</h2></div><span className="progress">{progress}/3</span></section>
    <section className="routine-list glass">{routine.map(([number, title, detail], index) => <button className={`routine-item ${checked[index] ? "done" : ""}`} key={number} onClick={() => toggleRoutine(index)}><span className="check">{checked[index] ? "✓" : number}</span><span className="routine-copy"><strong>{title}</strong><small>{detail}</small></span><span className="chevron">›</span></button>)}</section>
    <section className="tip glass"><span className="tip-icon">✦</span><p><strong>좋은 시작이에요.</strong><br />준비를 끝내면 친구들에게 바로 알려줄 수 있어요.</p></section>{!signedIn && <button className="login-note" onClick={startSession}>로그인하고 내 루틴 저장하기</button>}
  </main>;
}
