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
          <div key={item.label} className="flex flex-1 flex-col justify-end gap-2">
            <div
              className="rounded-t-md"
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
      <div className="mt-4 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.24em] text-slate-500">
        <span className="mono">{data[0]?.label ?? ""}</span>
        <span className="mono">{data[data.length - 1]?.label ?? ""}</span>
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
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <div
        className="relative flex h-40 w-40 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${gradient.join(", ")})`,
        }}
      >
        <div className="absolute inset-[14px] rounded-full bg-[#111722]" />
        <div className="relative z-10 text-center">
          <div className="mono text-4xl font-semibold text-white">{valueLabel}</div>
        </div>
      </div>
      <div className="flex gap-6">
        {data.map((item) => (
          <div key={item.label} className="mono text-xs uppercase tracking-[0.24em]">
            <span style={{ color: item.color }}>
              {item.label} ({Math.round((item.value / total) * 100)}%)
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
    <div className="space-y-4">
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
              stroke="rgba(148, 163, 184, 0.08)"
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
              stroke="rgba(148, 163, 184, 0.08)"
            />
          );
        })}
        {lines.map((line) => (
          <g key={line.key}>
            {!line.dashed ? (
              <path d={createAreaPath(line.key)} fill={`${line.color}18`} />
            ) : null}
            <path
              d={createPath(line.key)}
              stroke={line.color}
              strokeWidth="3"
              fill="none"
              strokeDasharray={line.dashed ? "8 8" : undefined}
            />
          </g>
        ))}
      </svg>

      <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
        {data.filter((_, index) => index % Math.ceil(data.length / 5 || 1) === 0).map((row) => (
          <span key={row.date} className="mono">
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
    <div className="space-y-6">
      {data.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="mono text-xs uppercase tracking-[0.2em] text-slate-400">
              {item.label}
            </div>
            <div className="mono text-xs uppercase tracking-[0.18em] text-[#28d26f]">
              {Math.round((item.value / max) * 100)}%
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4f8cff] to-[#28d26f]"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScatterPlot({
  points,
}: {
  points: { x: number; y: number; label: string; color: string }[];
}) {
  return (
    <div className="relative h-[260px] rounded-[1.25rem] border border-white/6 bg-black/20">
      <div className="absolute inset-0 grid grid-cols-5 grid-rows-3">
        {Array.from({ length: 15 }).map((_, index) => (
          <div key={index} className="border border-white/5" />
        ))}
      </div>
      {points.map((point) => (
        <div
          key={`${point.label}-${point.x}-${point.y}`}
          title={point.label}
          className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
          style={{
            left: `${(point.x / 10) * 100}%`,
            top: `${100 - (point.y / 3) * 100}%`,
            background: point.color,
            boxShadow: `0 0 18px ${point.color}55`,
          }}
        />
      ))}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-slate-500">
        <span className="mono">Impact 1</span>
        <span className="mono">Impact 10</span>
      </div>
    </div>
  );
}
