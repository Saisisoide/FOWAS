export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#040608] px-4 py-6 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1400px] overflow-hidden rounded-[var(--radius-xl)] border border-white/[0.06] bg-[#060810] lg:grid-cols-[1.05fr_0.95fr]">

        {/* Hero */}
        <section className="relative hidden overflow-hidden border-r border-white/[0.06] lg:flex lg:flex-col"
          style={{
            background: "radial-gradient(ellipse at 20% 20%, rgba(59, 124, 245, 0.15), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(239, 68, 68, 0.06), transparent 40%), linear-gradient(180deg, #0a0d18, #060810)"
          }}
        >
          <div className="flex-1 p-10">
            <div className="space-y-5">
              <span className="mono inline-flex rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Failure-Oriented Workflow Analysis
              </span>
              <div>
                <p className="text-4xl font-bold tracking-tight text-white">
                  FOWAS
                </p>
                <p className="mt-3 max-w-md text-[14px] leading-relaxed text-slate-500">
                  Reliability intelligence for engineering teams.
                  Turn failures into structured operational learning.
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 pt-0 space-y-3">
            {[
              "Deterministic risk scoring from severity × impact",
              "MTTR, MTBF, and availability reliability metrics",
              "Cause-chain failure propagation modeling",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <p className="text-[12px] leading-relaxed text-slate-400">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Form */}
        <section className="flex items-center justify-center p-6 md:p-10">{children}</section>
      </div>
    </div>
  );
}
