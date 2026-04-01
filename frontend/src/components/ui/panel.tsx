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
    <section className={`app-panel p-5 md:p-6 ${className}`}>
      {(title || eyebrow || right) && (
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="mono text-[11px] uppercase tracking-widest text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className={`text-[15px] font-semibold tracking-wide text-white ${eyebrow ? "mt-1.5" : ""}`}>
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
