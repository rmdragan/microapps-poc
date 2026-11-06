import type { TimeseriesPoint } from "@micro/api";
import { useEffect, useId, useState } from "react";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function VolumeChart({ data }: { data: TimeseriesPoint[] }) {
  const wide = useMediaQuery("(min-width: 640px)");
  const gradientId = `volume-${useId().replace(/:/g, "")}`;

  // The chart is redrawn at a smaller viewBox on phones so labels stay legible
  // instead of shrinking with the container.
  const width = wide ? 760 : 360;
  const height = wide ? 240 : 210;
  const pad = wide
    ? { top: 16, right: 14, bottom: 30, left: 46 }
    : { top: 12, right: 8, bottom: 28, left: 42 };
  const labelEvery = wide ? 2 : 3;
  const ticks = wide ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1];

  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const peak = Math.max(...data.map((point) => point.volume), 1);
  const yMax = Math.ceil(peak / 500) * 500;

  const x = (index: number) =>
    pad.left + (index / Math.max(1, data.length - 1)) * innerWidth;
  const y = (value: number) => pad.top + innerHeight - (value / yMax) * innerHeight;

  const line = data
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.volume)}`)
    .join(" ");
  const area = `${line} L${x(data.length - 1)},${pad.top + innerHeight} L${x(0)},${pad.top + innerHeight} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Daily parcel volume for the last 14 days"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cf4a0c" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#cf4a0c" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((tick) => {
        const lineY = pad.top + innerHeight * (1 - tick);
        return (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={lineY}
              y2={lineY}
              className="stroke-line"
              strokeDasharray={tick === 0 ? undefined : "3 4"}
            />
            <text
              x={pad.left - 10}
              y={lineY + 4}
              textAnchor="end"
              className="fill-ink-mute text-[10px]"
            >
              {Math.round(yMax * tick).toLocaleString("en-GB")}
            </text>
          </g>
        );
      })}

      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        className="stroke-accent"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.map((point, index) => (
        <g key={point.day}>
          <circle
            cx={x(index)}
            cy={y(point.volume)}
            r={2.5}
            className="fill-surface stroke-accent"
            strokeWidth={1.5}
          >
            <title>{`${point.label}: ${point.volume.toLocaleString("en-GB")} parcels`}</title>
          </circle>
          {index % labelEvery === 0 ? (
            <text
              x={x(index)}
              y={height - 8}
              textAnchor="middle"
              className="fill-ink-mute text-[10px]"
            >
              {point.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
