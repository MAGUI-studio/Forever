import { pageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { foreverTheme } from "@/config/brand";
import "./admin.css";

export const metadata = {
  ...pageMetadata({ title: "Painel administrativo | Forever", index: false, path: "/admin" }),
  alternates: undefined,
};
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <div style={foreverTheme} className="admin-root min-h-svh text-[#161616]">
        <Suspense
          fallback={
            <div className="admin-loading" role="status">
              Preparando nosso espaço…
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </NuqsAdapter>
  );
}
