export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#070b10] px-4 py-6 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1500px] overflow-hidden rounded-[2rem] border border-white/8 bg-[#090d13] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(68,132,255,0.32),transparent_35%),linear-gradient(180deg,#121b2e,#09111d)] p-10 lg:flex lg:flex-col">
          <div className="space-y-6">
            <span className="mono inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-300">
              Failure-Oriented Workflow Analysis System
            </span>
            <div>
              <p className="text-6xl font-bold uppercase leading-none tracking-tight text-white">
                FOWAS
              </p>
              <p className="mono mt-4 max-w-xl text-sm uppercase tracking-[0.26em] text-slate-300">
                Reliability intelligence for teams who want to turn failures into
                structured operational learning.
              </p>
            </div>
          </div>

          <div className="mt-auto grid gap-4">
            {[
              "Deterministic risk scoring from severity and impact",
              "MTTR, MTBF, and availability-driven reliability panels",
              "Incident taxonomy, cause-chain linking, and operator notes",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
              >
                <p className="mono text-xs uppercase tracking-[0.22em] text-slate-200">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10">{children}</section>
      </div>
    </div>
  );
}
