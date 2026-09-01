import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./chat.css";
import "./forms.css";
import "./share.css";
import "./switch.css";
import "./dashboard.css";
import "./location.css";
import "./map.css";

export const metadata: Metadata = { title: "Momentum | 약속을 지키는 루틴", description: "친구와 함께 약속을 지키는 출발 루틴 서비스" };
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
      </body>
    </html>
  );
}
