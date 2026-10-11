import type { Metadata } from "next";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./admin.css";
export const metadata: Metadata = {
  title: "Painel administrativo",
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NuqsAdapter>
      <Suspense
        fallback={
          <div className="admin-loading" role="status">
            Preparando nosso espaço…
          </div>
        }
      >
        {children}
      </Suspense>
    </NuqsAdapter>
  );
}
