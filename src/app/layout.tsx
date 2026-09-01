import type { Metadata } from "next";
import Script from "next/script";
import { ChatLocationPanel } from "@/components/chat-location-panel";
import "./globals.css";
import "./chat.css";
import "./forms.css";
import "./share.css";
import "./switch.css";
import "./dashboard.css";
import "./location.css";
import "./map.css";
import "./viewer.css";
import "./membership.css";
import "./delete.css";

export const metadata: Metadata = { title: "약속 | 약속을 지키는 루틴", description: "친구와 함께 약속을 지키는 출발 루틴 서비스" };
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        <Script id="session-migration" strategy="beforeInteractive">
          {`try {
            const raw = localStorage.getItem("momentum-session");
            if (raw) {
              const session = JSON.parse(raw);
              if (!session || typeof session !== "object" || typeof session.name !== "string" || typeof session.email !== "string") {
                localStorage.removeItem("momentum-session");
              }
            }
          } catch {
            localStorage.removeItem("momentum-session");
          }`}
        </Script>
        {children}
        <ChatLocationPanel />
      </body>
    </html>
  );
}
