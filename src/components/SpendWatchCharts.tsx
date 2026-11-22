import type { CategorySlice, ChartPoint, SpendWatchModel } from "@/lib/spend-watch";

export function SpendWatchCharts({ model }: { model: SpendWatchModel }) {
  const categoryTotal = model.categories.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <section className="watch-grid" aria-label="Spend watched charts">
      <article className="card watch-card">
        <span className="card-label">Blocked clicks</span>
        <strong className="watch-metric">{model.blockedLabel}</strong>
        <em className="watch-delta up">{model.blockedDelta}</em>
        <AreaChart points={model.blockedSeries} />
      </article>

      <article className="card watch-card">
        <span className="card-label">Ad spend saved</span>
        <strong className="watch-metric">{model.savedTotalLabel}</strong>
        <em className="watch-delta up">{model.savedDelta}</em>
        <BarChart points={model.savedBars} />
      </article>

      <article className="card watch-card">
        <span className="card-label">Blocked clicks by category</span>
        <div className="watch-donut-row">
          <DonutChart slices={model.categories} />
          <ul className="watch-legend">
            {model.categories.map((slice) => {
              const share = categoryTotal > 0 ? Math.round((slice.value / categoryTotal) * 1000) / 10 : 0;
              return (
                <li key={slice.id}>
                  <i className="swatch" style={{ background: slice.color }} />
                  <span>{slice.label}</span>
                  <strong>
                    {slice.id === "none" ? "—" : slice.value.toLocaleString("en-US")}
                    {slice.id === "none" ? "" : ` (${share}%)`}
                  </strong>
                </li>
              );
            })}
          </ul>
        </div>
      </article>

      <article className="card watch-card">
        <span className="card-label">Ad spend saved over time</span>
        <strong className="watch-metric">{model.savedOverTimeLabel}</strong>
        <em className="watch-delta up">{model.savedOverTimeDelta}</em>
        <AreaChart points={model.savedOverTime} />
      </article>
    </section>
  );
}

function AreaChart({ points }: { points: ChartPoint[] }) {
  const width = 320;
  const height = 120;
  const padX = 8;
  const padY = 12;
  const max = Math.max(1, ...points.map((point) => point.value));
  const step = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;
  const coords = points.map((point, i) => {
    const x = padX + i * step;
    const y = height - padY - (point.value / max) * (height - padY * 2);
    return { x, y, label: point.label, value: point.value };
  });
  const line = coords.map((point, i) => `${i === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const area = `${line} L${coords.at(-1)?.x ?? padX},${height - padY} L${padX},${height - padY} Z`;

  return (
    <div className="watch-chart" aria-hidden>
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <path d={area} className="watch-area" />
        <path d={line} className="watch-line" />
      </svg>
      <div className="watch-x">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function BarChart({ points }: { points: ChartPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return (
    <div className="watch-bars" aria-hidden>
      {points.map((point) => (
        <div className="watch-bar-col" key={point.label}>
          <div className="watch-bar" style={{ height: `${Math.max(8, Math.round((point.value / max) * 100))}%` }} />
          <span>{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ slices }: { slices: CategorySlice[] }) {
  const size = 148;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(1, slices.reduce((sum, slice) => sum + slice.value, 0));
  let offset = 0;

  return (
    <svg className="watch-donut" viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={radius} className="watch-donut-track" strokeWidth={stroke} />
      {slices.map((slice) => {
        const length = (slice.value / total) * circumference;
        const node = (
          <circle
            key={slice.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="watch-donut-slice"
            stroke={slice.color}
            strokeWidth={stroke}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
          />
        );
        offset += length;
        return node;
      })}
    </svg>
  );
}
