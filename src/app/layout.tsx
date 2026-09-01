import type { Metadata } from "next";
import "./globals.css";
import "./chat.css";
import "./forms.css";
import "./share.css";
import "./switch.css";
import "./dashboard.css";
import "./location.css";

export const metadata: Metadata = { title: "Momentum | 약속을 지키는 루틴", description: "친구와 함께 약속을 지키는 출발 루틴 서비스" };
export default function RootLayout({ children }: LayoutProps<"/">) { return <html lang="ko"><body>{children}</body></html>; }
