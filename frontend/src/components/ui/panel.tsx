import type { ReactNode } from "react";

export function Panel({
  title,
  eyebrow,
  right,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`app-panel rounded-[1.75rem] p-5 md:p-6 ${className}`}>
      {(title || eyebrow || right) && (
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="mono text-[10px] uppercase tracking-[0.35em] text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-2 text-xl font-semibold uppercase tracking-[0.08em] text-white">
                {title}
              </h2>
            ) : null}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}
