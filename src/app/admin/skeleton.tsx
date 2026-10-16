import { GuestStats } from "./GuestStats";
import { SectionDivider } from "@/components/ui/SectionDivider";

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={
        "block animate-pulse rounded-[var(--wedding-radius)] bg-[#722f3712] motion-reduce:animate-none " +
        className
      }
    />
  );
}

export function DashboardSkeleton({ checkIn = false }: { checkIn?: boolean }) {
  return (
    <div role="status" aria-label="Carregando convites" aria-busy="true" className="space-y-5">
      <span className="sr-only">Carregando convites…</span>
      {["Famílias e grupos", "Convites individuais"].map((title) => (
        <section key={title} className="space-y-5">
          <SectionDivider
            title={title}
            count={0}
            actions={<SkeletonBlock className="h-9 w-28" />}
          />
          {checkIn ? (
            <article className="rounded-[var(--wedding-radius)] border border-[#722f3720] bg-[#fffefbdb] p-5 sm:p-7">
              <SkeletonBlock className="h-9 w-52 max-w-full" />
              <SkeletonBlock className="mt-2 h-4 w-28" />
              <div className="mt-4 divide-y divide-[#722f3715]">
                {[0, 1].map((row) => (
                  <div
                    key={row}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 last:pb-0 sm:flex sm:justify-between"
                  >
                    <SkeletonBlock className="h-5 w-28" />
                    <SkeletonBlock className="h-9 w-44" />
                  </div>
                ))}
              </div>
            </article>
          ) : (
            <article className="admin-invite">
              <div className="admin-invite-header">
                <SkeletonBlock className="h-9 w-56 max-w-full" />
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((action) => (
                    <SkeletonBlock key={action} className="size-[42px]" />
                  ))}
                </div>
              </div>
              <SkeletonBlock className="mt-3 h-4 w-64 max-w-full" />
              <SkeletonBlock className="mt-3 h-3 w-3/4" />
              <div className="mt-5">
                {Array.from({ length: title === "Famílias e grupos" ? 3 : 1 }, (_, row) => (
                  <details
                    key={row}
                    className="rsvp-guest-accordion admin-guest-accordion last:border-b-0! [&:last-child>summary]:pb-0!"
                  >
                    <summary className="pointer-events-none">
                      <SkeletonBlock className="h-5 w-28" />
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          <SkeletonBlock className="size-[42px]" />
                          <SkeletonBlock className="size-[42px]" />
                        </div>
                        <SkeletonBlock className="h-9 w-[180px] max-[600px]:w-32" />
                        <SkeletonBlock className="size-4" />
                      </div>
                    </summary>
                  </details>
                ))}
              </div>
            </article>
          )}
        </section>
      ))}
    </div>
  );
}

export function GuestStatsSkeleton() {
  return <GuestStats guests={[]} loading />;
}
