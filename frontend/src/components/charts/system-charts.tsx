import { formatShortDate } from "@/lib/fowas";

export function BarChart({
  data,
  height = 220,
}: {
  data: { label: string; value: number; color: string }[];
  height?: number;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((item) => (
          <div key={item.label} className="group relative flex flex-1 flex-col items-center justify-end gap-2">
            {/* Value tooltip on hover */}
            <span className="mono text-[11px] tabular-nums text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
              {item.value}
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{
                height: `${(item.value / max) * 100}%`,
                minHeight: item.value > 0 ? 16 : 4,
                background: item.color,
                opacity: 0.3 + item.value / max / 1.6,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        {data.map((item) => (
          <span key={item.label} className="flex-1 text-center text-[11px] text-slate-500">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  valueLabel,
}: {
  data: { label: string; value: number; color: string }[];
  valueLabel: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const gradient = data
    .map((item) => ({
      ...item,
      fraction: (item.value / total) * 100,
    }))
    .reduce<string[]>((segments, item, index, array) => {
      const start = array
        .slice(0, index)
        .reduce((sum, segment) => sum + segment.fraction, 0);
      segments.push(`${item.color} ${start}% ${start + item.fraction}%`);
      return segments;
    }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div
        className="relative flex h-36 w-36 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${gradient.join(", ")})`,
        }}
      >
        <div className="absolute inset-[12px] rounded-full bg-[#0d1019]" />
        <div className="relative z-10 text-center">
          <div className="mono text-3xl font-semibold tabular-nums text-white">{valueLabel}</div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: item.color }}
            />
            <span>{item.label}</span>
            <span className="mono tabular-nums text-slate-500">
              {Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineAreaChart({
  data,
  lines,
}: {
  data: { date: string; [key: string]: number | string }[];
  lines: { key: string; color: string; dashed?: boolean }[];
}) {
  const width = 1000;
  const height = 320;
  const padding = 28;
  const values = data.flatMap((row) =>
    lines.map((line) => Number(row[line.key] ?? 0)),
  );
  const max = Math.max(...values, 1);

  function createPath(key: string) {
    return data
      .map((row, index) => {
        const x =
          padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
        const y =
          height - padding - (Number(row[key] ?? 0) / max) * (height - padding * 2);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  function createAreaPath(key: string) {
    const path = createPath(key);
    const lastX = width - padding;
    const firstX = padding;
    return `${path} L ${lastX} ${height - padding} L ${firstX} ${height - padding} Z`;
  }

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] w-full">
        {[0, 1, 2, 3, 4].map((step) => {
          const y = padding + (step / 4) * (height - padding * 2);
          return (
            <line
              key={step}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="rgba(148, 163, 184, 0.07)"
            />
          );
        })}
        {data.map((row, index) => {
          const x =
            padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
          return (
            <line
              key={row.date}
              x1={x}
              x2={x}
              y1={padding}
              y2={height - padding}
              stroke="rgba(148, 163, 184, 0.05)"
            />
          );
        })}
        {lines.map((line) => (
          <g key={line.key}>
            {!line.dashed ? (
              <path d={createAreaPath(line.key)} fill={`${line.color}12`} />
            ) : null}
            <path
              d={createPath(line.key)}
              stroke={line.color}
              strokeWidth="2.5"
              fill="none"
              strokeDasharray={line.dashed ? "8 8" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
      </svg>

      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
        {data.filter((_, index) => index % Math.ceil(data.length / 5 || 1) === 0).map((row) => (
          <span key={row.date}>
            {formatShortDate(row.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProgressList({
  data,
  maxValue,
}: {
  data: { label: string; value: number; count?: number }[];
  maxValue?: number;
}) {
  const max = maxValue ?? Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-5">
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No workflow data available.
        </p>
      ) : (
        data.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-300 truncate">
                {item.label}
              </span>
              <span className="mono text-xs tabular-nums text-[var(--green)]">
                {Math.round((item.value / max) * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--blue)] to-[var(--green)] transition-all duration-500"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function ScatterPlot({
  points,
}: {
  points: { x: number; y: number; label: string; color: string }[];
}) {
  return (
    <div className="relative h-[260px] rounded-[var(--radius-lg)] border border-white/6 bg-black/20">
      <div className="absolute inset-0 grid grid-cols-5 grid-rows-3">
        {Array.from({ length: 15 }).map((_, index) => (
          <div key={index} className="border border-white/[0.04]" />
        ))}
      </div>
      {points.map((point) => (
        <div
          key={`${point.label}-${point.x}-${point.y}`}
          title={point.label}
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 transition-transform hover:scale-150"
          style={{
            left: `${(point.x / 10) * 100}%`,
            top: `${100 - (point.y / 3) * 100}%`,
            background: point.color,
            boxShadow: `0 0 14px ${point.color}44`,
          }}
        />
      ))}
      <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between text-[11px] text-slate-500">
        <span>Impact 1</span>
        <span>Impact 10</span>
      </div>
    </div>
  );
}
